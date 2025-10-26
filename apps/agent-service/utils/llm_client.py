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
        destination = f"{booking.get('city', 'Destination')}, {booking.get('state', '')}"
        
        logger.info(f"📦 Using fallback itinerary for {destination}")
        
        return {
            "itinerary": [
                {
                    "day_number": 1,
                    "date": booking.get('check_in', ''),
                    "morning": {
                        "time": "9:00 AM",
                        "activity": "Arrival and Check-in",
                        "description": "Arrive at your accommodation and settle in"
                    },
                    "afternoon": {
                        "time": "2:00 PM",
                        "activity": "Explore City Center",
                        "description": "Take a walking tour of the main attractions"
                    },
                    "evening": {
                        "time": "7:00 PM",
                        "activity": "Welcome Dinner",
                        "description": "Try local cuisine at a recommended restaurant"
                    }
                }
            ],
            "activities": [
                {
                    "title": f"{destination} City Tour",
                    "description": "Explore the highlights of the city",
                    "duration": "3-4 hours",
                    "price_tier": "$$",
                    "tags": ["culture", "walking"],
                    "accessibility": {"wheelchair": True, "child_friendly": True}
                }
            ],
            "restaurants": [
                {
                    "name": "Local Favorite",
                    "cuisine": "Local",
                    "dietary_tags": ["all"],
                    "price_tier": "$$",
                    "description": "Popular spot with locals"
                }
            ],
            "packing_list": [
                "Comfortable walking shoes",
                "Weather-appropriate clothing",
                "Sunscreen and hat",
                "Camera for photos",
                "Reusable water bottle"
            ],
            "local_tips": [
                "Check local transportation options",
                "Book popular attractions in advance",
                "Ask locals for hidden gems"
            ],
            "weather_summary": "Check forecast closer to travel dates"
        }
    
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

