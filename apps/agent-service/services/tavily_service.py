# services/tavily_service.py
import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ tavily-python not installed, using mock data")
    TAVILY_AVAILABLE = False

class TavilyService:
    """Web search service using Tavily API"""
    
    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY", "")
        
        if not self.api_key:
            logger.warning("⚠️ TAVILY_API_KEY not set, using fallback data")
            self.client = None
        elif TAVILY_AVAILABLE:
            try:
                self.client = TavilyClient(api_key=self.api_key)
                logger.info("✅ Tavily client initialized")
            except Exception as e:
                logger.error(f"❌ Tavily init error: {e}")
                self.client = None
        else:
            self.client = None
    
    async def search_combined(
        self,
        location: str,
        dates: Dict[str, str],
        dietary: Optional[List[str]] = None,
        interests: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Combined search - one API call instead of 4 separate ones
        Reduces cost by 75%
        """
        try:
            if not self.client:
                logger.warning("⚠️ Tavily client not available, using mock data")
                return self._get_fallback_data(location, dates)
            
            # Build comprehensive query
            dietary_str = ", ".join(dietary) if dietary else ""
            interests_str = ", ".join(interests) if interests else "popular attractions"
            
            query = f"""
            For {location} travel from {dates.get('check_in')} to {dates.get('check_out')}:
            1. Top attractions and points of interest ({interests_str})
            2. Local events and festivals
            3. {dietary_str} restaurants if specified, otherwise popular restaurants
            4. Weather forecast
            """
            
            logger.info(f"🔍 Tavily search: {location}")
            
            result = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=5
            )
            
            # Parse and structure results
            parsed_data = self._parse_tavily_results(result, location, dates)
            
            logger.info(f"✅ Tavily search completed for {location}")
            return parsed_data
            
        except Exception as e:
            logger.error(f"❌ Tavily search error: {e}")
            return self._get_fallback_data(location, dates)
    
    def _parse_tavily_results(self, result: Dict, location: str, dates: Dict) -> Dict[str, Any]:
        """Parse Tavily API results into structured format"""
        
        pois = []
        events = []
        restaurants = []
        weather_info = None
        
        # Extract information from results
        results_list = result.get('results', [])
        
        for item in results_list:
            content = item.get('content', '').lower()
            title = item.get('title', '')
            url = item.get('url', '')
            
            # Categorize based on content
            if 'weather' in content or 'forecast' in content or 'temperature' in content:
                weather_info = {
                    'summary': item.get('content', '')[:200],
                    'source': url
                }
            elif 'restaurant' in content or 'food' in content or 'dining' in content:
                restaurants.append({
                    'name': title,
                    'description': content[:200],
                    'source': url
                })
            elif 'event' in content or 'festival' in content or 'concert' in content:
                events.append({
                    'name': title,
                    'description': content[:200],
                    'source': url
                })
            else:
                pois.append({
                    'name': title,
                    'description': content[:200],
                    'source': url
                })
        
        return {
            'pois': pois[:10],
            'events': events[:5],
            'restaurants': restaurants[:8],
            'weather': weather_info
        }
    
    def _get_fallback_data(self, location: str, dates: Dict) -> Dict[str, Any]:
        """
        Fallback data when Tavily is not available
        Uses static recommendations
        """
        logger.info(f"📦 Using fallback data for {location}")
        
        # Generic recommendations
        return {
            'pois': [
                {
                    'name': f'{location} City Center',
                    'description': 'Explore the heart of the city with shops, cafes, and historic architecture',
                    'tags': ['culture', 'walking']
                },
                {
                    'name': f'{location} Museum',
                    'description': 'Learn about local history and culture',
                    'tags': ['culture', 'indoor']
                },
                {
                    'name': 'Local Park',
                    'description': 'Enjoy outdoor activities and nature',
                    'tags': ['nature', 'outdoor', 'family-friendly']
                },
                {
                    'name': 'Waterfront Area',
                    'description': 'Scenic views and relaxing atmosphere',
                    'tags': ['scenic', 'relaxation']
                }
            ],
            'events': [
                {
                    'name': 'Local Farmers Market',
                    'description': 'Weekend market with local produce and crafts',
                    'tags': ['food', 'local']
                }
            ],
            'restaurants': [
                {
                    'name': 'Local Cuisine Restaurant',
                    'description': 'Authentic local dishes',
                    'cuisine': 'Local',
                    'price_tier': '$$'
                },
                {
                    'name': 'International Cafe',
                    'description': 'Diverse menu with vegetarian options',
                    'cuisine': 'International',
                    'price_tier': '$'
                },
                {
                    'name': 'Fine Dining',
                    'description': 'Upscale dining experience',
                    'cuisine': 'Contemporary',
                    'price_tier': '$$$'
                }
            ],
            'weather': {
                'summary': f'Typical weather for {location} during this season. Please check a weather service closer to your travel dates.',
                'advice': 'Pack layers and check forecast before departure'
            }
        }
    
    async def search_weather(self, location: str, dates: Dict) -> Optional[Dict[str, Any]]:
        """Search for weather forecast (separate method if needed)"""
        try:
            if not self.client:
                return None
            
            query = f"weather forecast {location} {dates.get('check_in')} to {dates.get('check_out')}"
            
            result = self.client.search(query=query, max_results=2)
            
            if result.get('results'):
                return {
                    'summary': result['results'][0].get('content', '')[:300],
                    'source': result['results'][0].get('url', '')
                }
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Weather search error: {e}")
            return None

# Global instance
tavily_service = TavilyService()

