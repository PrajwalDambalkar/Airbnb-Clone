# rag/retriever.py
import logging
from typing import Dict, Any, List
from .embeddings import embedding_service
from .vector_store import vector_store

logger = logging.getLogger(__name__)

class RAGRetriever:
    """RAG retrieval orchestrator"""
    
    def __init__(self):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.min_count_threshold = 10  # Minimum itineraries needed for RAG
    
    async def retrieve_similar_trips(
        self,
        location: str,
        party_type: str,
        interests: List[str]
    ) -> Dict[str, Any]:
        """
        Retrieve similar trips from vector store
        """
        try:
            # Check if we have enough data
            count = self.vector_store.count()
            
            if count < self.min_count_threshold:
                logger.info(f"⚠️ Only {count} itineraries in DB (need {self.min_count_threshold}), skipping RAG")
                return {
                    'similar_trips': [],
                    'confidence': 0.0,
                    'count': count
                }
            
            # Build query text
            query_text = f"Trip to {location} for {party_type}"
            if interests:
                query_text += f" interested in {', '.join(interests)}"
            
            logger.info(f"🔍 RAG search: {query_text}")
            
            # Generate embedding
            query_embedding = self.embedding_service.encode(query_text)
            
            # Search vector store
            similar = self.vector_store.search_similar(query_embedding, n_results=3)
            
            # Calculate confidence based on similarity
            confidence = 0.0
            if similar:
                # Higher confidence if results are very similar
                avg_distance = sum(r.get('distance', 1.0) for r in similar) / len(similar)
                confidence = max(0.0, 1.0 - avg_distance)
            
            logger.info(f"✅ RAG retrieval: {len(similar)} results, confidence: {confidence:.2f}")
            
            return {
                'similar_trips': similar,
                'confidence': confidence,
                'count': count
            }
            
        except Exception as e:
            logger.error(f"❌ RAG retrieval error: {e}")
            return {
                'similar_trips': [],
                'confidence': 0.0,
                'count': 0
            }
    
    async def add_generated_itinerary(
        self,
        booking_id: int,
        location: str,
        itinerary_data: Dict[str, Any]
    ):
        """
        Add newly generated itinerary to vector store for future RAG
        """
        try:
            # Create document text
            doc_text = f"Trip to {location}\n"
            doc_text += f"Itinerary: {str(itinerary_data)[:500]}"
            
            # Generate embedding
            embedding = self.embedding_service.encode(doc_text)
            
            # Add to vector store
            self.vector_store.add_itinerary(
                itinerary_id=f"booking_{booking_id}",
                location=location,
                itinerary_data=itinerary_data,
                embedding=embedding
            )
            
            logger.info(f"✅ Stored itinerary for booking {booking_id} in RAG")
            
        except Exception as e:
            logger.error(f"❌ Error storing in RAG: {e}")

# Global instance
rag_retriever = RAGRetriever()

