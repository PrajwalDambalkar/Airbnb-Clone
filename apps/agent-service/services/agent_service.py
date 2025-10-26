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
    
    async def process_chat(self, user_id: int, message: str, booking_id: int = None, conversation_history: list = None) -> Dict[str, Any]:
        """
        Process conversational chat message
        
        Determines intent and responds appropriately:
        - Show bookings
        - Plan a trip
        - Answer questions
        - General conversation
        """
        
        logger.info(f"💬 Processing chat for user {user_id}: '{message}' (history: {len(conversation_history or [])} msgs)")
        
        try:
            # Normalize message for intent detection
            message_lower = message.lower().strip()
            conversation_history = conversation_history or []
            
            # Intent detection
            is_booking_query = any(keyword in message_lower for keyword in [
                'booking', 'bookings', 'reservation', 'reservations', 
                'my trips', 'my trip', 'upcoming trip', 'my travel'
            ])
            
            is_plan_query = any(keyword in message_lower for keyword in [
                'plan', 'itinerary', 'schedule', 'activities', 
                'what to do', 'where to go', 'recommend'
            ])
            
            is_policy_query = any(keyword in message_lower for keyword in [
                'policy', 'policies', 'cancellation', 'cancel', 'refund',
                'payment', 'pay', 'charge', 'fee', 'fees',
                'rules', 'house rules', 'guest rules', 'privacy',
                'terms', 'conditions', 'modify', 'change booking'
            ])
            
            # INTENT 1: Show user's bookings
            if is_booking_query and not is_plan_query:
                logger.info("🎯 Intent: Show bookings")
                
                # Fetch user's bookings from MySQL
                bookings = self.mysql.get_user_bookings(user_id)
                
                if not bookings or len(bookings) == 0:
                    return {
                        "message": "You don't have any bookings yet. Browse our properties and make your first booking to start your travel journey! ✈️",
                        "data": None
                    }
                
                # Filter for active bookings (ACCEPTED or PENDING)
                active_bookings = [b for b in bookings if b['status'] in ['ACCEPTED', 'PENDING']]
                
                if len(active_bookings) == 0:
                    return {
                        "message": f"You have {len(bookings)} booking(s), but none are currently active. All your bookings have been cancelled or rejected.",
                        "data": {"bookings": bookings}
                    }
                
                # Create friendly message
                booking_word = "booking" if len(active_bookings) == 1 else "bookings"
                message_parts = [
                    f"You have {len(active_bookings)} active {booking_word}! 🎉\n"
                ]
                
                for i, booking in enumerate(active_bookings[:3], 1):  # Show max 3 in text
                    status_emoji = "✅" if booking['status'] == 'ACCEPTED' else "⏳"
                    message_parts.append(
                        f"{status_emoji} {booking['property_name']} in {booking['city']}, {booking['state']}"
                    )
                
                if len(active_bookings) > 3:
                    message_parts.append(f"\n...and {len(active_bookings) - 3} more!")
                
                message_parts.append("\n\nWould you like me to help you plan any of these trips?")
                
                return {
                    "message": "\n".join(message_parts),
                    "data": {"bookings": active_bookings}
                }
            
            # INTENT 2: Plan a trip
            elif is_plan_query and booking_id:
                logger.info(f"🎯 Intent: Plan trip for booking {booking_id}")
                
                # Use existing plan generation
                from models.schemas import AgentRequest, UserPreferences
                
                request = AgentRequest(
                    booking_id=booking_id,
                    user_id=user_id,
                    query=message,
                    preferences=UserPreferences(),
                    secret="internal"
                )
                
                plan = await self.generate_plan(request)
                
                return {
                    "message": f"🎉 I've created a personalized travel plan for your trip to {plan['destination']}! Check out the itinerary below.",
                    "data": {"plan": plan}
                }
            
            # INTENT 3: Need booking context for planning
            elif is_plan_query and not booking_id:
                logger.info("🎯 Intent: Plan trip (but no booking specified)")
                
                # Fetch bookings
                bookings = self.mysql.get_user_bookings(user_id)
                active_bookings = [b for b in bookings if b['status'] == 'ACCEPTED']
                
                if len(active_bookings) == 0:
                    return {
                        "message": "To create a travel plan, you'll need an accepted booking first. Would you like to see your current bookings?",
                        "data": None
                    }
                elif len(active_bookings) == 1:
                    return {
                        "message": f"I can help you plan your trip to {active_bookings[0]['city']}, {active_bookings[0]['state']}! What kind of activities are you interested in? (adventure, food, culture, relaxation, etc.)",
                        "data": {"bookings": active_bookings}
                    }
                else:
                    return {
                        "message": f"You have {len(active_bookings)} accepted bookings. Which trip would you like me to help you plan?",
                        "data": {"bookings": active_bookings}
                    }
            
            # INTENT 4: Policy Query
            elif is_policy_query and not (is_booking_query or is_plan_query):
                logger.info("🎯 Intent: Policy query")
                
                from rag.policy_loader import policy_loader
                
                # Search policy documents
                policy_results = policy_loader.search_policies(message, n_results=3)
                
                if not policy_results:
                    return {
                        "message": "I couldn't find specific information about that policy. Please contact our support team for detailed policy information, or try rephrasing your question.",
                        "data": None
                    }
                
                # Build context from retrieved policies
                policy_context = "\n\n".join([
                    f"[{result['metadata'].get('policy_type', 'Policy')}]\n{result['content']}"
                    for result in policy_results
                ])
                
                # Build conversation context
                context_messages = "\n".join([
                    f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                    for msg in conversation_history[-4:]
                ])
                
                # Use LLM to generate natural answer
                prompt = f"""You are a helpful AI assistant for an Airbnb-like platform.

CONVERSATION HISTORY:
{context_messages if context_messages else 'No previous conversation'}

USER'S QUESTION: "{message}"

RELEVANT POLICY INFORMATION:
{policy_context}

Based ONLY on the policy information provided above, answer the user's question clearly and concisely.
If the provided information doesn't fully answer the question, say so and suggest they contact support.
Keep the response under 4 sentences and use a friendly, helpful tone.

Answer:"""
                
                llm_response = await self.llm.chat(prompt)
                
                # Add source attribution
                sources = list(set([r['metadata'].get('policy_type', 'Policy') for r in policy_results]))
                source_text = f"\n\n📋 Source: {', '.join(sources)}"
                
                return {
                    "message": llm_response + source_text,
                    "data": {
                        "policy_sources": sources,
                        "retrieved_chunks": len(policy_results)
                    }
                }
            
            # INTENT 5: General conversation / help
            else:
                logger.info("🎯 Intent: General conversation")
                
                # Build conversation context for LLM
                context_messages = "\n".join([
                    f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                    for msg in conversation_history[-6:]  # Last 6 messages for context
                ])
                
                # Use LLM for general responses with conversation context
                prompt = f"""You are a friendly AI travel assistant for an Airbnb-like platform.

CONVERSATION HISTORY:
{context_messages if context_messages else 'No previous conversation'}

USER'S CURRENT MESSAGE: "{message}"

Provide a helpful, friendly response. Keep it concise (2-3 sentences max) and remember the conversation context.

IMPORTANT: 
- If they mentioned specific cities/bookings earlier, remember that context
- If they're asking follow-up questions about a location, reference what you know
- If they express interests (like "Hollywood glamour" or "beaches"), incorporate that into your response
- If relevant, suggest they can ask to see their bookings or get help planning a trip

Response:"""
                
                llm_response = await self.llm.chat(prompt)
                
                return {
                    "message": llm_response,
                    "data": None
                }
                
        except Exception as e:
            logger.error(f"❌ Chat processing failed: {e}", exc_info=True)
            return {
                "message": "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.",
                "data": None
            }

# Global instance
agent_service = AgentService()

