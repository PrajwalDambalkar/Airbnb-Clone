# routes/agent_routes.py
import os
import logging
from fastapi import APIRouter, HTTPException, status
from models.schemas import AgentRequest, AgentResponse
from services.agent_service import agent_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])

# Secret token for backend authentication
AGENT_SECRET = os.getenv("AGENT_SERVICE_SECRET", "change-this-secret-in-production")

@router.post("/plan", status_code=status.HTTP_200_OK)
async def create_travel_plan(request: AgentRequest):
    """
    Generate personalized travel plan for a booking
    
    Security: Requires secret token from backend
    """
    
    try:
        # Verify request came from backend
        if request.secret != AGENT_SECRET:
            logger.warning("⚠️ Invalid secret token in request")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication token"
            )
        
        logger.info(f"🎯 Plan request: booking={request.booking_id}, user={request.user_id}")
        
        # Generate plan
        response = await agent_service.generate_plan(request)
        
        return response
        
    except ValueError as e:
        logger.error(f"❌ Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Plan generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate travel plan: {str(e)}"
        )

@router.post("/query")
async def process_natural_language_query(
    query: str,
    booking_id: int,
    secret: str
):
    """
    Process natural language query
    Example: "find vegan restaurants near my hotel"
    """
    
    try:
        # Verify secret
        if secret != AGENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication token"
            )
        
        logger.info(f"💬 Query: {query}")
        
        # Process query
        result = await agent_service.process_query(query, {"booking_id": booking_id})
        
        return {"query": query, "result": result}
        
    except Exception as e:
        logger.error(f"❌ Query processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

