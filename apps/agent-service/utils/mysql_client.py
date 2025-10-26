# utils/mysql_client.py
import os
import json
from typing import Optional, Dict, List, Any
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MySQLClient:
    """MySQL database client for agent service"""
    
    def __init__(self):
        """Initialize MySQL client (lazy connection)"""
        self.pool = None
        self._config = {
            "pool_name": "agent_pool",
            "pool_size": 5,
            "pool_reset_session": True,
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", "3306")),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", ""),
            "database": os.getenv("DB_NAME", "airbnb_db")
        }
        logger.info("✅ MySQL client initialized (lazy connection)")
    
    def _ensure_pool(self):
        """Ensure connection pool is created (lazy initialization)"""
        if self.pool is None:
            try:
                self.pool = pooling.MySQLConnectionPool(**self._config)
                logger.info("✅ MySQL connection pool created")
            except Exception as e:
                logger.error(f"❌ MySQL connection error: {e}")
                raise
    
    def get_connection(self):
        """Get connection from pool"""
        self._ensure_pool()
        return self.pool.get_connection()
    
    def get_booking_details(self, booking_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch complete booking details with property info
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT 
                    b.id as booking_id,
                    b.check_in,
                    b.check_out,
                    b.number_of_guests,
                    b.party_type,
                    b.status,
                    p.property_name,
                    p.city,
                    p.state,
                    p.address,
                    p.bedrooms,
                    p.bathrooms,
                    p.amenities,
                    p.property_type
                FROM bookings b
                JOIN properties p ON b.property_id = p.id
                WHERE b.id = %s
            """
            
            cursor.execute(query, (booking_id,))
            result = cursor.fetchone()
            
            if result:
                # Parse JSON fields
                if result.get('amenities'):
                    try:
                        result['amenities'] = json.loads(result['amenities'])
                    except:
                        result['amenities'] = []
                
                # Convert dates to strings
                if result.get('check_in'):
                    result['check_in'] = result['check_in'].strftime('%Y-%m-%d')
                if result.get('check_out'):
                    result['check_out'] = result['check_out'].strftime('%Y-%m-%d')
                
                logger.info(f"✅ Booking {booking_id} fetched: {result['city']}, {result['state']}")
            else:
                logger.warning(f"⚠️ Booking {booking_id} not found")
            
            cursor.close()
            conn.close()
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error fetching booking {booking_id}: {e}", exc_info=True)
            return None
    
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """
        Fetch user travel preferences (if table exists)
        For now, returns defaults
        """
        # TODO: Implement when user_preferences table is added
        return {
            "budget": "medium",
            "interests": [],
            "dietary_restrictions": [],
            "mobility_needs": {}
        }
    
    def get_user_bookings(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Fetch all user's bookings (current and upcoming)
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT 
                    b.id,
                    b.check_in,
                    b.check_out,
                    b.number_of_guests,
                    b.status,
                    b.total_price,
                    p.property_name,
                    p.city,
                    p.state,
                    p.property_type,
                    p.images
                FROM bookings b
                JOIN properties p ON b.property_id = p.id
                WHERE b.traveler_id = %s
                ORDER BY b.check_in DESC
            """
            
            cursor.execute(query, (user_id,))
            results = cursor.fetchall()
            
            # Convert dates to strings and parse JSON fields
            for result in results:
                if result.get('check_in'):
                    result['check_in'] = result['check_in'].strftime('%Y-%m-%d')
                if result.get('check_out'):
                    result['check_out'] = result['check_out'].strftime('%Y-%m-%d')
                if result.get('images'):
                    try:
                        result['images'] = json.loads(result['images'])
                    except:
                        result['images'] = []
            
            logger.info(f"✅ Found {len(results)} bookings for user {user_id}")
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error fetching user bookings: {e}", exc_info=True)
            return []
    
    def get_user_booking_history(self, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fetch user's past bookings for context
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT 
                    b.id,
                    b.check_in,
                    b.check_out,
                    b.party_type,
                    p.city,
                    p.state,
                    p.property_type
                FROM bookings b
                JOIN properties p ON b.property_id = p.id
                WHERE b.traveler_id = %s 
                  AND b.status = 'ACCEPTED'
                  AND b.check_out < CURDATE()
                ORDER BY b.check_out DESC
                LIMIT %s
            """
            
            cursor.execute(query, (user_id, limit))
            results = cursor.fetchall()
            
            # Convert dates to strings
            for result in results:
                if result.get('check_in'):
                    result['check_in'] = result['check_in'].strftime('%Y-%m-%d')
                if result.get('check_out'):
                    result['check_out'] = result['check_out'].strftime('%Y-%m-%d')
            
            logger.info(f"✅ Found {len(results)} past bookings for user {user_id}")
            
            cursor.close()
            conn.close()
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error fetching booking history: {e}", exc_info=True)
            return []
    
    def save_itinerary(self, booking_id: int, user_id: int, itinerary_data: Dict[str, Any]) -> bool:
        """
        Save generated itinerary to database (optional)
        Requires itineraries table to exist
        """
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if table exists
            cursor.execute("SHOW TABLES LIKE 'itineraries'")
            if not cursor.fetchone():
                logger.warning("⚠️ itineraries table does not exist, skipping save")
                cursor.close()
                conn.close()
                return False
            
            query = """
                INSERT INTO itineraries (booking_id, user_id, itinerary_data, created_at)
                VALUES (%s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                booking_id,
                user_id,
                json.dumps(itinerary_data),
                datetime.now()
            ))
            
            conn.commit()
            logger.info(f"✅ Itinerary saved for booking {booking_id}")
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error saving itinerary: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Test database connection"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            logger.info("✅ MySQL connection test passed")
            return True
        except Exception as e:
            logger.error(f"❌ MySQL connection test failed: {e}")
            return False

# Global instance
mysql_client = MySQLClient()

