from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import os

load_dotenv()

app = FastAPI(
    title="Airbnb AI Agent Service",
    description="RAG-powered travel planning with Ollama",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AgentRequest(BaseModel):
    booking_id: str
    location: str
    dates: dict
    preferences: dict
    query: str

class AgentResponse(BaseModel):
    itinerary: dict
    recommendations: list
    packing_list: list

@app.get("/")
async def root():
    return {
        "message": "Airbnb AI Agent Service is running with Ollama!",
        "model": os.getenv("OLLAMA_MODEL", "llama3"),
        "status": "operational"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "ollama": "connected",
        "model": os.getenv("OLLAMA_MODEL", "llama3")
    }

@app.post("/agent/plan", response_model=AgentResponse)
async def create_travel_plan(request: AgentRequest):
    """Generate personalized travel itinerary"""
    # TODO: Implement RAG pipeline
    return {
        "itinerary": {
            "day_1": "RAG implementation coming",
            "day_2": "Placeholder",
            "day_3": "Placeholder"
        },
        "recommendations": [
            {"type": "restaurant", "name": "Coming soon"}
        ],
        "packing_list": ["Coming soon"]
    }

@app.get("/test-ollama")
async def test_ollama():
    """Test Ollama connection"""
    try:
        from langchain_ollama import OllamaLLM
        
        llm = OllamaLLM(
            model=os.getenv("OLLAMA_MODEL", "llama3"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        )
        
        response = llm.invoke("Say hello in one short sentence")
        
        return {
            "status": "success",
            "model": os.getenv("OLLAMA_MODEL", "llama3"),
            "response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
    # , reload=True)
