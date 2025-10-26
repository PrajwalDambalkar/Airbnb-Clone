# services/agent_service.py
import logging
from typing import Dict, Any
from datetime import datetime

from models.schemas import AgentRequest, AgentResponse, DayPlan, ActivityCard, Restaurant, TimeBlock
from utils.mysql_client import mysql_client
from utils.llm_client import llm_client
from services.tavily_service import tavily_service
from rag.retriever import rag_retriever

logger = logging.getLogger(__name__)

class AgentService:
    """Main orchestration service for travel planning"""
    
    def __init__(self):
        self.mysql = mysql_client
        self.llm = llm_client
        self.tavily = tavily_service
        self.rag = rag_retriever
    
    async def generate_plan(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Main workflow to generate personalized travel plan
        
        Steps:
        1. Fetch booking details from MySQL
        2. Optionally search RAG for similar trips
        3. Search web for POIs, restaurants, events, weather
        4. Combine all context
        5. Generate itinerary with LLM
        6. Parse and return structured response
        """
        
        logger.info(f"🚀 Starting plan generation for booking {request.booking_id}")
        
        try:
            # ============================================
            # STEP 1: Fetch from MySQL
            # ============================================
            logger.info("📊 STEP 1: Fetching booking details...")
            
            booking_data = self.mysql.get_booking_details(request.booking_id)
            
            if not booking_data:
                raise ValueError(f"Booking {request.booking_id} not found")
            
            # Verify booking belongs to user (security check)
            # This is already done by backend, but double-check
            
            logger.info(f"✅ Booking fetched: {booking_data['city']}, {booking_data['state']}")
            
            # Get user history (for context)
            booking_history = self.mysql.get_user_booking_history(request.user_id, limit=3)
            
            # ============================================
            # STEP 2: RAG Retrieval (Optional)
            # ============================================
            logger.info("🔍 STEP 2: RAG retrieval...")
            
            rag_results = await self.rag.retrieve_similar_trips(
                location=f"{booking_data['city']}, {booking_data['state']}",
                party_type=booking_data.get('party_type', 'couple'),
                interests=request.preferences.interests if request.preferences else []
            )
            
            if rag_results['count'] < 10:
                logger.info(f"⚠️ RAG skipped: only {rag_results['count']} itineraries in DB")
            else:
                logger.info(f"✅ RAG: {len(rag_results['similar_trips'])} similar trips found")
            
            # ============================================
            # STEP 3: Tavily Web Search
            # ============================================
            logger.info("🌐 STEP 3: Tavily web search...")
            
            tavily_data = await self.tavily.search_combined(
                location=f"{booking_data['city']}, {booking_data['state']}",
                dates={
                    'check_in': booking_data['check_in'],
                    'check_out': booking_data['check_out']
                },
                dietary=request.preferences.dietary_restrictions if request.preferences else None,
                interests=request.preferences.interests if request.preferences else None
            )
            
            logger.info(f"✅ Tavily: {len(tavily_data['pois'])} POIs, {len(tavily_data['restaurants'])} restaurants")
            
            # ============================================
            # STEP 4: Aggregate Context
            # ============================================
            logger.info("📦 STEP 4: Aggregating context...")
            
            combined_context = {
                'booking': booking_data,
                'preferences': request.preferences.dict() if request.preferences else {},
                'query': request.query,
                'tavily_data': tavily_data,
                'rag_results': rag_results,
                'booking_history': booking_history
            }
            
            # ============================================
            # STEP 5: Generate with LLM
            # ============================================
            logger.info("🤖 STEP 5: Generating itinerary with LLM...")
            
            itinerary_data = await self.llm.generate_itinerary(combined_context)
            
            logger.info("✅ Itinerary generated")
            
            # ============================================
            # STEP 6: Format Response
            # ============================================
            logger.info("📋 STEP 6: Formatting response...")
            
            response = self._format_response(
                booking_id=request.booking_id,
                booking_data=booking_data,
                itinerary_data=itinerary_data
            )
            
            # ============================================
            # STEP 7: Save to RAG (for future retrievals)
            # ============================================
            logger.info("💾 STEP 7: Saving to RAG...")
            
            await self.rag.add_generated_itinerary(
                booking_id=request.booking_id,
                location=f"{booking_data['city']}, {booking_data['state']}",
                itinerary_data=itinerary_data
            )
            
            logger.info(f"🎉 Plan generation completed for booking {request.booking_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Plan generation failed: {e}", exc_info=True)
            raise
    
    def _format_response(
        self,
        booking_id: int,
        booking_data: Dict[str, Any],
        itinerary_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Format the final response
        """
        
        # Build response
        response = {
            'booking_id': booking_id,
            'destination': f"{booking_data['city']}, {booking_data['state']}",
            'dates': {
                'check_in': booking_data['check_in'],
                'check_out': booking_data['check_out']
            },
            'itinerary': itinerary_data.get('itinerary', []),
            'activities': itinerary_data.get('activities', []),
            'restaurants': itinerary_data.get('restaurants', []),
            'packing_list': itinerary_data.get('packing_list', []),
            'local_tips': itinerary_data.get('local_tips', []),
            'weather_summary': itinerary_data.get('weather_summary', 'Check weather forecast before departure'),
            'generated_at': datetime.now().isoformat()
        }
        
        return response
    
    async def process_query(self, query: str, context: Dict[str, Any]) -> str:
        """
        Process natural language query
        """
        # TODO: Implement NLU query processing
        # For now, just return the query
        return query

# Global instance
agent_service = AgentService()

