import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from pymongo import MongoClient
from pymongo.errors import PyMongoError
from bson import ObjectId

logger = logging.getLogger(__name__)


def _to_object_id(value: Any) -> Optional[ObjectId]:
    """Safely convert value to ObjectId."""
    if value is None:
        return None
    try:
        return ObjectId(str(value))
    except Exception:
        logger.warning("⚠️ Invalid ObjectId value: %s", value)
        return None


def _format_date(value: Any) -> Optional[str]:
    """Convert datetime/date values to ISO date string."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    try:
        return value.isoformat()
    except Exception:
        return str(value)


def _serialize_booking(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize booking document for downstream consumption."""
    property_info = doc.get("property") or {}

    return {
        "booking_id": str(doc.get("_id")),
        "property_id": str(doc.get("property_id")) if doc.get("property_id") else None,
        "traveler_id": str(doc.get("traveler_id")) if doc.get("traveler_id") else None,
        "check_in": _format_date(doc.get("check_in")),
        "check_out": _format_date(doc.get("check_out")),
        "number_of_guests": doc.get("number_of_guests"),
        "party_type": doc.get("party_type", "couple"),
        "status": doc.get("status"),
        "total_price": doc.get("total_price"),
        "property_name": property_info.get("property_name"),
        "city": property_info.get("city"),
        "state": property_info.get("state"),
        "address": property_info.get("address"),
        "bedrooms": property_info.get("bedrooms"),
        "bathrooms": property_info.get("bathrooms"),
        "amenities": property_info.get("amenities", []),
        "property_type": property_info.get("property_type"),
        "images": property_info.get("images", []),
    }


class MongoBookingClient:
    """MongoDB client used by the agent service."""

    def __init__(self):
        uri = os.getenv("MONGODB_URI", "mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority")
        db_name = os.getenv("MONGODB_DB_NAME", "airbnb_db")
        self._client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self._db = self._client[db_name]
        self._bookings = self._db["bookings"]
        self._properties = self._db["properties"]
        self._itineraries = self._db["itineraries"]
        logger.info("✅ MongoDB client initialized for db '%s'", db_name)

    # --------------------------------------------------------------------- #
    # Core queries
    # --------------------------------------------------------------------- #
    def get_booking_details(self, booking_id: str) -> Optional[Dict[str, Any]]:
        """Fetch booking with linked property details."""
        object_id = _to_object_id(booking_id)
        if not object_id:
            return None

        try:
            pipeline = [
                {"$match": {"_id": object_id}},
                {
                    "$lookup": {
                        "from": "properties",
                        "localField": "property_id",
                        "foreignField": "_id",
                        "as": "property",
                    }
                },
                {"$unwind": {"path": "$property", "preserveNullAndEmptyArrays": True}},
            ]

            result = list(self._bookings.aggregate(pipeline))
            if not result:
                logger.warning("⚠️ Booking %s not found in MongoDB", booking_id)
                return None

            booking = _serialize_booking(result[0])
            logger.info("✅ Booking %s fetched from MongoDB", booking_id)
            return booking
        except PyMongoError as exc:
            logger.error("❌ MongoDB error fetching booking %s: %s", booking_id, exc, exc_info=True)
            return None

    def get_user_bookings(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch bookings for a traveler."""
        user_object_id = _to_object_id(user_id)
        if not user_object_id:
            return []

        try:
            pipeline = [
                {"$match": {"traveler_id": user_object_id}},
                {
                    "$lookup": {
                        "from": "properties",
                        "localField": "property_id",
                        "foreignField": "_id",
                        "as": "property",
                    }
                },
                {"$unwind": {"path": "$property", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"check_in": -1}},
            ]

            results = [
                _serialize_booking(doc)
                for doc in self._bookings.aggregate(pipeline)
            ]

            logger.info("✅ Found %s bookings for user %s", len(results), user_id)
            return results
        except PyMongoError as exc:
            logger.error("❌ MongoDB error fetching bookings for user %s: %s", user_id, exc, exc_info=True)
            return []

    def get_user_booking_history(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch user's past accepted bookings."""
        user_object_id = _to_object_id(user_id)
        if not user_object_id:
            return []

        try:
            pipeline = [
                {"$match": {
                    "traveler_id": user_object_id,
                    "status": "ACCEPTED",
                    "check_out": {"$lt": datetime.utcnow()}
                }},
                {
                    "$lookup": {
                        "from": "properties",
                        "localField": "property_id",
                        "foreignField": "_id",
                        "as": "property",
                    }
                },
                {"$unwind": {"path": "$property", "preserveNullAndEmptyArrays": True}},
                {"$sort": {"check_out": -1}},
                {"$limit": limit},
            ]

            history = [
                {
                    "booking_id": str(doc.get("_id")),
                    "check_in": _format_date(doc.get("check_in")),
                    "check_out": _format_date(doc.get("check_out")),
                    "party_type": doc.get("party_type"),
                    "city": doc.get("property", {}).get("city"),
                    "state": doc.get("property", {}).get("state"),
                    "property_type": doc.get("property", {}).get("property_type"),
                }
                for doc in self._bookings.aggregate(pipeline)
            ]

            logger.info("✅ Found %s past bookings for user %s", len(history), user_id)
            return history
        except PyMongoError as exc:
            logger.error("❌ MongoDB error fetching booking history for user %s: %s", user_id, exc, exc_info=True)
            return []

    def save_itinerary(self, booking_id: str, user_id: str, itinerary_data: Dict[str, Any]) -> bool:
        """Persist generated itinerary into MongoDB."""
        booking_object_id = _to_object_id(booking_id)
        user_object_id = _to_object_id(user_id)

        if not booking_object_id or not user_object_id:
            return False

        try:
            document = {
                "booking_id": booking_object_id,
                "user_id": user_object_id,
                "itinerary_data": itinerary_data,
                "created_at": datetime.utcnow(),
            }
            self._itineraries.insert_one(document)
            logger.info("✅ Itinerary saved for booking %s", booking_id)
            return True
        except PyMongoError as exc:
            logger.error("❌ Failed to save itinerary for booking %s: %s", booking_id, exc, exc_info=True)
            return False

    # --------------------------------------------------------------------- #
    # Health checks
    # --------------------------------------------------------------------- #
    def test_connection(self) -> bool:
        """Ping MongoDB to ensure connectivity."""
        try:
            self._client.admin.command("ping")
            logger.info("✅ MongoDB connection test passed")
            return True
        except PyMongoError as exc:
            logger.error("❌ MongoDB connection test failed: %s", exc)
            return False


# Global singleton
mongo_client = MongoBookingClient()


