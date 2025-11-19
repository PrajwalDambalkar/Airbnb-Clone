# main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Airbnb AI Agent Service",
    description="AI-powered travel planning with LangChain + Ollama + RAG",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5000")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from routes.health_routes import router as health_router
from routes.agent_routes import router as agent_router
from routes.admin_routes import router as admin_router

# Include routers
app.include_router(health_router)
app.include_router(agent_router)
app.include_router(admin_router)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting Airbnb AI Agent Service...")
    
    # Test connections
    try:
        from utils.mongo_client import mongo_client
        if mongo_client.test_connection():
            logger.info("✅ MongoDB connection successful")
        else:
            logger.warning("⚠️ MongoDB connection failed")
    except Exception as e:
        logger.error(f"❌ MongoDB connection error: {e}")
    
    try:
        from utils.llm_client import llm_client
        if llm_client.test_connection():
            logger.info("✅ Ollama connection successful")
        else:
            logger.warning("⚠️ Ollama connection failed")
    except Exception as e:
        logger.error(f"❌ Ollama connection error: {e}")
    
    # Load policy documents into RAG
    try:
        from rag.policy_loader import policy_loader
        logger.info("📚 Loading policy documents...")
        policy_loader.ingest_policies()
        logger.info("✅ Policy documents loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ Policy loading failed (non-critical): {e}")
    
    logger.info("✅ Agent service ready!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Shutting down Agent Service...")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("AGENT_PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
