# utils/llm_client.py
import os
import json
import re
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from langchain_ollama import OllamaLLM
    OLLAMA_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ langchain-ollama not installed")
    OLLAMA_AVAILABLE = False

class LLMClient:
    """Ollama LLM client for generating itineraries"""
    
    def __init__(self):
        self.model = os.getenv("OLLAMA_MODEL", "llama3")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        if OLLAMA_AVAILABLE:
            try:
                self.llm = OllamaLLM(
                    model=self.model,
                    base_url=self.base_url,
                    temperature=0.7
                )
                logger.info(f"✅ Ollama LLM initialized: {self.model}")
            except Exception as e:
                logger.error(f"❌ Ollama init error: {e}")
                self.llm = None
        else:
            self.llm = None
    
    def build_prompt(self, context: Dict[str, Any]) -> str:
        """
        Build comprehensive prompt for itinerary generation
        """
        booking = context.get('booking', {})
        preferences = context.get('preferences', {})
        tavily_data = context.get('tavily_data', {})
        user_query = context.get('query', '')
        
        # Extract data
        destination = f"{booking.get('city', '')}, {booking.get('state', '')}"
        check_in = booking.get('check_in', '')
        check_out = booking.get('check_out', '')
        guests = booking.get('number_of_guests', 2)
        party_type = booking.get('party_type', 'couple')
        
        # Calculate number of days
        try:
            from datetime import datetime
            start = datetime.strptime(check_in, '%Y-%m-%d')
            end = datetime.strptime(check_out, '%Y-%m-%d')
            num_days = (end - start).days
        except:
            num_days = 3
        
        # Get POIs and restaurants
        pois = tavily_data.get('pois', [])
        restaurants = tavily_data.get('restaurants', [])
        events = tavily_data.get('events', [])
        weather = tavily_data.get('weather', {})
        
        # Build preferences string
        budget = preferences.get('budget', 'medium')
        dietary = preferences.get('dietary_restrictions', [])
        mobility = preferences.get('mobility_needs', {})
        interests = preferences.get('interests', [])
        
        dietary_str = ", ".join(dietary) if dietary else "No specific dietary restrictions"
        interests_str = ", ".join(interests) if interests else "general sightseeing"
        
        # Build prompt
        prompt = f"""You are an expert travel planner creating a personalized itinerary.

**TRIP DETAILS:**
- Destination: {destination}
- Dates: {check_in} to {check_out} ({num_days} days)
- Party: {party_type} with {guests} guests
- Budget: {budget}
- Interests: {interests_str}
- Dietary: {dietary_str}

**USER REQUEST:**
{user_query if user_query else "Create a comprehensive travel plan"}

**AVAILABLE ATTRACTIONS:**
{self._format_pois(pois[:10])}

**LOCAL RESTAURANTS:**
{self._format_restaurants(restaurants[:8])}

**LOCAL EVENTS:**
{self._format_events(events[:5])}

**WEATHER INFO:**
{weather.get('summary', 'Check weather forecast closer to travel dates')}

**YOUR TASK:**
Create a detailed {num_days}-day itinerary with:
1. Daily schedule (morning, afternoon, evening activities)
2. Activity recommendations with practical details
3. Restaurant suggestions filtered by dietary needs
4. Packing checklist based on weather and activities
5. Local tips for travelers

**OUTPUT FORMAT (STRICT JSON):**
Return ONLY valid JSON with this exact structure:
{{
  "itinerary": [
    {{
      "day_number": 1,
      "date": "{check_in}",
      "morning": {{
        "time": "9:00 AM",
        "activity": "Activity name",
        "description": "Brief description"
      }},
      "afternoon": {{
        "time": "2:00 PM",
        "activity": "Activity name",
        "description": "Brief description"
      }},
      "evening": {{
        "time": "7:00 PM",
        "activity": "Activity name",
        "description": "Brief description"
      }}
    }}
  ],
  "activities": [
    {{
      "title": "Activity name",
      "description": "What to expect",
      "duration": "2-3 hours",
      "price_tier": "free|$|$$|$$$",
      "tags": ["culture", "outdoor"],
      "accessibility": {{"wheelchair": true, "child_friendly": true}}
    }}
  ],
  "restaurants": [
    {{
      "name": "Restaurant name",
      "cuisine": "Type",
      "dietary_tags": ["{dietary_str if dietary else 'all'}"],
      "price_tier": "$|$$|$$$",
      "description": "Why recommended"
    }}
  ],
  "packing_list": [
    "Item 1 (reason)",
    "Item 2 (reason)"
  ],
  "local_tips": [
    "Tip 1",
    "Tip 2"
  ],
  "weather_summary": "Brief weather overview"
}}

**IMPORTANT RULES:**
- ONLY restaurants matching dietary restrictions: {dietary_str}
- Activities suitable for {party_type} with {guests} people
- Budget-appropriate suggestions for {budget} budget
- Include accessibility info if mobility needs specified
- Return ONLY valid JSON, no extra text
- Include realistic time estimates
- Consider weather in recommendations
"""
        
        return prompt
    
    def _format_pois(self, pois: list) -> str:
        """Format POIs for prompt"""
        if not pois:
            return "Popular local attractions"
        
        formatted = []
        for i, poi in enumerate(pois[:10], 1):
            name = poi.get('name', f'Attraction {i}')
            desc = poi.get('description', 'Local point of interest')
            formatted.append(f"{i}. {name}: {desc[:100]}")
        
        return "\n".join(formatted)
    
    def _format_restaurants(self, restaurants: list) -> str:
        """Format restaurants for prompt"""
        if not restaurants:
            return "Local dining options available"
        
        formatted = []
        for i, rest in enumerate(restaurants[:8], 1):
            name = rest.get('name', f'Restaurant {i}')
            desc = rest.get('description', 'Local restaurant')
            formatted.append(f"{i}. {name}: {desc[:100]}")
        
        return "\n".join(formatted)
    
    def _format_events(self, events: list) -> str:
        """Format events for prompt"""
        if not events:
            return "Check local event calendars"
        
        formatted = []
        for i, event in enumerate(events[:5], 1):
            name = event.get('name', f'Event {i}')
            desc = event.get('description', 'Local event')
            formatted.append(f"{i}. {name}: {desc[:100]}")
        
        return "\n".join(formatted)
    
    async def generate_itinerary(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate itinerary using Ollama
        """
        try:
            if not self.llm:
                logger.warning("⚠️ Ollama not available, using fallback")
                return self._get_fallback_itinerary(context)
            
            # Build prompt
            prompt = self.build_prompt(context)
            
            logger.info(f"🤖 Generating itinerary with {self.model}...")
            
            # Call Ollama
            response = self.llm.invoke(prompt)
            
            logger.info(f"✅ Ollama response received ({len(response)} chars)")
            
            # Parse response
            parsed = self.parse_response(response)
            
            return parsed
            
        except Exception as e:
            logger.error(f"❌ Ollama generation error: {e}")
            return self._get_fallback_itinerary(context)
    
    def parse_response(self, response: str) -> Dict[str, Any]:
        """
        Robust JSON parsing from LLM output
        """
        logger.info("🔍 Parsing LLM response...")
        
        # Method 1: Try direct parse
        try:
            return json.loads(response)
        except:
            pass
        
        # Method 2: Extract from markdown code block
        json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                pass
        
        # Method 3: Extract from code block (any language)
        code_match = re.search(r'```\s*(.*?)\s*```', response, re.DOTALL)
        if code_match:
            try:
                return json.loads(code_match.group(1))
            except:
                pass
        
        # Method 4: Find first { to last }
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end > start:
            try:
                json_str = response[start:end]
                return json.loads(json_str)
            except:
                pass
        
        # Method 5: Fix common JSON issues
        try:
            fixed = response.replace("'", '"')  # Single to double quotes
            fixed = re.sub(r',\s*}', '}', fixed)  # Trailing commas
            fixed = re.sub(r',\s*]', ']', fixed)
            return json.loads(fixed)
        except:
            pass
        
        logger.error("❌ Could not parse LLM response as JSON")
        raise ValueError("Invalid JSON response from LLM")
    
    def _get_fallback_itinerary(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback itinerary when Ollama is unavailable
        """
        booking = context.get('booking', {})
        tavily_data = context.get('tavily_data', {})
        destination = f"{booking.get('city', 'Destination')}, {booking.get('state', '')}"
        num_days = context.get('num_days', 3)
        
        # Get real weather data if available from Tavily
        weather_info = tavily_data.get('weather', {})
        weather_summary = weather_info.get('summary', f"Check the weather forecast for {destination} closer to your travel dates. Pack layers and be prepared for changing conditions.")
        
        logger.info(f"📦 Using fallback itinerary for {destination} ({num_days} days)")
        if weather_info:
            logger.info(f"🌤️ Including real weather data in fallback")
        
        # Generate itinerary for each day
        itinerary = []
        for day in range(1, num_days + 1):
            day_activities = {
                1: {
                    "morning": {
                        "time": "9:00 AM",
                        "activity": "Arrival and Check-in",
                        "description": "Arrive at your accommodation, settle in, and get oriented with the neighborhood"
                    },
                    "afternoon": {
                        "time": "2:00 PM",
                        "activity": "Explore City Center",
                        "description": "Take a leisurely walking tour of the main downtown attractions and landmarks"
                    },
                    "evening": {
                        "time": "7:00 PM",
                        "activity": "Welcome Dinner",
                        "description": "Try authentic local cuisine at a popular neighborhood restaurant"
                    }
                },
                2: {
                    "morning": {
                        "time": "8:30 AM",
                        "activity": "Local Market Visit",
                        "description": "Experience the local culture at the farmer's market or street food scene"
                    },
                    "afternoon": {
                        "time": "1:00 PM",
                        "activity": "Museum or Cultural Site",
                        "description": "Visit a renowned museum or historical landmark in the area"
                    },
                    "evening": {
                        "time": "6:30 PM",
                        "activity": "Sunset Views",
                        "description": "Find a scenic spot to watch the sunset followed by dinner"
                    }
                },
                3: {
                    "morning": {
                        "time": "9:00 AM",
                        "activity": "Outdoor Adventure",
                        "description": "Enjoy nature with a hike, beach visit, or park exploration"
                    },
                    "afternoon": {
                        "time": "2:00 PM",
                        "activity": "Shopping & Souvenirs",
                        "description": "Browse local shops and pick up unique souvenirs to remember your trip"
                    },
                    "evening": {
                        "time": "7:00 PM",
                        "activity": "Farewell Dinner",
                        "description": "Celebrate your trip with a special dinner at a top-rated restaurant"
                    }
                }
            }
            
            # Use day-specific activities or repeat pattern
            activities_key = day if day <= 3 else ((day - 1) % 3) + 1
            day_plan = day_activities.get(activities_key, day_activities[1])
            
            itinerary.append({
                "day_number": day,
                "date": booking.get('check_in', '') if day == 1 else f"Day {day}",
                "morning": day_plan["morning"],
                "afternoon": day_plan["afternoon"],
                "evening": day_plan["evening"]
            })
        
        return {
            "itinerary": itinerary,
            "activities": [
                {
                    "title": f"{destination} City Walking Tour",
                    "description": "Explore the highlights and hidden gems of the city on foot with a local guide",
                    "duration": "3-4 hours",
                    "price_tier": "$$",
                    "tags": ["culture", "walking", "history"],
                    "accessibility": {"wheelchair": True, "child_friendly": True}
                },
                {
                    "title": "Local Food Experience",
                    "description": "Taste authentic local dishes and learn about the culinary traditions",
                    "duration": "2-3 hours",
                    "price_tier": "$$$",
                    "tags": ["food", "culture"],
                    "accessibility": {"wheelchair": True, "child_friendly": True}
                },
                {
                    "title": "Outdoor Adventure",
                    "description": "Experience nature with hiking, kayaking, or beach activities",
                    "duration": "4-5 hours",
                    "price_tier": "$$",
                    "tags": ["outdoor", "nature", "adventure"],
                    "accessibility": {"wheelchair": False, "child_friendly": True}
                },
                {
                    "title": "Museum & Culture",
                    "description": "Discover local art, history, and cultural heritage",
                    "duration": "2-3 hours",
                    "price_tier": "$",
                    "tags": ["culture", "indoor", "educational"],
                    "accessibility": {"wheelchair": True, "child_friendly": True}
                }
            ],
            "restaurants": [
                {
                    "name": "Local Favorite Bistro",
                    "cuisine": "Local & Regional",
                    "dietary_tags": ["all", "vegetarian options"],
                    "price_tier": "$$",
                    "description": "Popular neighborhood spot known for fresh, seasonal ingredients and friendly atmosphere"
                },
                {
                    "name": "Waterfront Dining",
                    "cuisine": "Seafood & International",
                    "dietary_tags": ["all", "pescatarian"],
                    "price_tier": "$$$",
                    "description": "Upscale dining with beautiful views and creative seafood dishes"
                },
                {
                    "name": "Street Food Market",
                    "cuisine": "Diverse International",
                    "dietary_tags": ["all", "vegan options", "gluten-free"],
                    "price_tier": "$",
                    "description": "Authentic local street food and international vendors in a vibrant market setting"
                }
            ],
            "packing_list": [
                "Comfortable walking shoes (for exploring)",
                "Weather-appropriate clothing (layers recommended)",
                "Sunscreen and hat (sun protection)",
                "Camera or smartphone (capture memories)",
                "Reusable water bottle (stay hydrated)",
                "Light backpack or day bag (for excursions)",
                "Power bank (keep devices charged)",
                "Travel adapter (if needed)",
                "Umbrella or rain jacket (be prepared)"
            ],
            "local_tips": [
                "🚇 Research public transportation options - many cities have great metro/bus systems",
                "🎟️ Book popular attractions and restaurants in advance to avoid disappointment",
                "💬 Don't hesitate to ask locals for recommendations - they know the best hidden gems",
                "📱 Download offline maps in case you lose internet connection",
                "💳 Check if your destination prefers cash or card payments",
                "🕐 Be aware of local business hours - some places close for lunch or have limited weekend hours",
                "🌍 Learn a few basic phrases in the local language - it's always appreciated",
                "📸 Take photos but also remember to enjoy the moment without your phone"
            ],
            "weather_summary": weather_summary
        }
    
    async def chat(self, prompt: str) -> str:
        """
        Simple chat/conversation with LLM
        """
        try:
            if not self.llm:
                logger.warning("⚠️ Ollama not available for chat")
                return "I'm currently unavailable. Please try again later or ask about your bookings!"
            
            response = self.llm.invoke(prompt)
            return response.strip()
            
        except Exception as e:
            logger.error(f"❌ Chat error: {e}")
            return "I apologize, but I'm having trouble responding right now. Please try rephrasing your question."
    
    def test_connection(self) -> bool:
        """Test Ollama connection"""
        try:
            if not self.llm:
                return False
            
            response = self.llm.invoke("Say 'OK' in one word")
            logger.info(f"✅ Ollama test: {response}")
            return True
        except Exception as e:
            logger.error(f"❌ Ollama test failed: {e}")
            return False

# Global instance
llm_client = LLMClient()

