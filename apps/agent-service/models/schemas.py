# models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date

# ============================================
# REQUEST MODELS
# ============================================

class UserPreferences(BaseModel):
    """User travel preferences"""
    budget: Optional[str] = Field(default="medium", description="Budget tier: low, medium, high, luxury")
    interests: Optional[List[str]] = Field(default=[], description="Interests: adventure, food, culture, relaxation, etc.")
    dietary_restrictions: Optional[List[str]] = Field(default=[], description="vegan, vegetarian, gluten-free, etc.")
    mobility_needs: Optional[Dict[str, bool]] = Field(default={}, description="wheelchair, elderly_friendly, child_friendly")

class AgentRequest(BaseModel):
    """Request to generate travel plan"""
    booking_id: int
    user_id: int
    query: Optional[str] = Field(default="", description="Natural language query")
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)
    secret: str = Field(..., description="Secret token from backend")

# ============================================
# RESPONSE MODELS
# ============================================

class ActivityCard(BaseModel):
    """Single activity recommendation"""
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    geo: Optional[Dict[str, float]] = None  # {"lat": 32.7341, "lng": -117.1441}
    price_tier: Optional[str] = "free"  # free, $, $$, $$$, $$$$
    duration: Optional[str] = None  # "2-3 hours"
    tags: Optional[List[str]] = []
    accessibility: Optional[Dict[str, bool]] = {}  # wheelchair, child_friendly

class TimeBlock(BaseModel):
    """Morning/Afternoon/Evening block"""
    time: str  # "9:00 AM"
    activity: str
    details: Optional[ActivityCard] = None

class DayPlan(BaseModel):
    """Single day itinerary"""
    date: str
    day_number: int
    morning: Optional[TimeBlock] = None
    afternoon: Optional[TimeBlock] = None
    evening: Optional[TimeBlock] = None

class Restaurant(BaseModel):
    """Restaurant recommendation"""
    name: str
    cuisine: Optional[str] = None
    dietary_tags: Optional[List[str]] = []
    price_tier: Optional[str] = "$$"
    address: Optional[str] = None
    description: Optional[str] = None

class AgentResponse(BaseModel):
    """Complete travel plan response"""
    booking_id: int
    destination: str
    dates: Dict[str, str]  # {"check_in": "2025-11-01", "check_out": "2025-11-05"}
    itinerary: List[DayPlan]
    activities: List[ActivityCard]
    restaurants: List[Restaurant]
    packing_list: List[str]
    local_tips: Optional[List[str]] = []
    weather_summary: Optional[str] = None

# ============================================
# INTERNAL DATA MODELS
# ============================================

class BookingData(BaseModel):
    """Booking details from MySQL"""
    booking_id: int
    property_name: str
    city: str
    state: str
    address: Optional[str] = None
    check_in: date
    check_out: date
    number_of_guests: int
    party_type: Optional[str] = "couple"
    amenities: Optional[List[str]] = []

class TavilySearchResult(BaseModel):
    """Result from Tavily web search"""
    pois: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []
    restaurants: List[Dict[str, Any]] = []
    weather: Optional[Dict[str, Any]] = None

class RAGResult(BaseModel):
    """Result from RAG retrieval"""
    similar_trips: List[Dict[str, Any]] = []
    confidence: float = 0.0

# ============================================
# HEALTH CHECK
# ============================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    services: Dict[str, str]
    timestamp: str

