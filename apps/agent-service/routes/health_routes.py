# routes/health_routes.py
import logging
from datetime import datetime
from fastapi import APIRouter, status
from .schemas import HealthResponse
from utils.mysql_client import mysql_client
from utils.llm_client import llm_client

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

@router.get("/", status_code=status.HTTP_200_OK)
async def root():
    """Root endpoint"""
    return {
        "message": "Airbnb AI Agent Service",
        "version": "1.0.0",
        "status": "operational"
    }

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check
    """
    
    services = {
        "api": "healthy",
        "mysql": "unknown",
        "ollama": "unknown",
        "tavily": "configured" if llm_client.llm else "not_configured"
    }
    
    # Test MySQL
    try:
        if mysql_client.test_connection():
            services["mysql"] = "connected"
        else:
            services["mysql"] = "disconnected"
    except Exception as e:
        logger.error(f"MySQL health check failed: {e}")
        services["mysql"] = "error"
    
    # Test Ollama
    try:
        if llm_client.test_connection():
            services["ollama"] = "connected"
        else:
            services["ollama"] = "disconnected"
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        services["ollama"] = "error"
    
    # Overall status
    overall_status = "healthy"
    if services["mysql"] != "connected":
        overall_status = "degraded"
    if services["ollama"] != "connected":
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        services=services,
        timestamp=datetime.now().isoformat()
    )

@router.get("/test-ollama")
async def test_ollama():
    """
    Test Ollama connection and generation
    """
    try:
        if not llm_client.llm:
            return {
                "status": "unavailable",
                "message": "Ollama not configured"
            }
        
        response = llm_client.llm.invoke("Say 'Hello from Ollama!' in one sentence")
        
        return {
            "status": "success",
            "model": llm_client.model,
            "response": response
        }
    except Exception as e:
        logger.error(f"Ollama test failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/test-mysql")
async def test_mysql():
    """
    Test MySQL connection
    """
    try:
        if mysql_client.test_connection():
            return {
                "status": "success",
                "message": "MySQL connection successful"
            }
        else:
            return {
                "status": "error",
                "message": "MySQL connection failed"
            }
    except Exception as e:
        logger.error(f"MySQL test failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

