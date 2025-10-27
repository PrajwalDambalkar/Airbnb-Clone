# rag/vector_store.py
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ chromadb not installed")
    CHROMADB_AVAILABLE = False

class VectorStore:
    """ChromaDB vector store for RAG"""
    
    def __init__(self):
        self.collection_name = "travel_itineraries"
        
        if CHROMADB_AVAILABLE:
            try:
                # Use persistent storage
                persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
                
                self.client = chromadb.Client(Settings(
                    persist_directory=persist_dir,
                    anonymized_telemetry=False
                ))
                
                # Get or create collection
                try:
                    self.collection = self.client.get_collection(self.collection_name)
                    logger.info(f"✅ ChromaDB collection loaded: {self.collection_name}")
                except:
                    self.collection = self.client.create_collection(
                        name=self.collection_name,
                        metadata={"description": "Travel itineraries and recommendations"}
                    )
                    logger.info(f"✅ ChromaDB collection created: {self.collection_name}")
                
            except Exception as e:
                logger.error(f"❌ ChromaDB init error: {e}")
                self.client = None
                self.collection = None
        else:
            self.client = None
            self.collection = None
    
    def add_itinerary(
        self,
        itinerary_id: str,
        location: str,
        itinerary_data: Dict[str, Any],
        embedding: List[float]
    ):
        """Add itinerary to vector store"""
        if not self.collection:
            logger.warning("⚠️ ChromaDB not available, skipping add")
            return
        
        try:
            # Create document text for retrieval
            doc_text = f"Location: {location}\n"
            doc_text += f"Itinerary: {str(itinerary_data)[:500]}"
            
            self.collection.add(
                ids=[itinerary_id],
                embeddings=[embedding],
                documents=[doc_text],
                metadatas=[{
                    "location": location,
                    "created_at": str(itinerary_data.get('created_at', ''))
                }]
            )
            
            logger.info(f"✅ Added itinerary {itinerary_id} to vector store")
            
        except Exception as e:
            logger.error(f"❌ Error adding to vector store: {e}")
    
    def search_similar(
        self,
        query_embedding: List[float],
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for similar itineraries"""
        if not self.collection:
            logger.warning("⚠️ ChromaDB not available, returning empty results")
            return []
        
        try:
            # Query collection
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            similar = []
            if results.get('documents') and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    similar.append({
                        'document': doc,
                        'metadata': results.get('metadatas', [[]])[0][i] if results.get('metadatas') else {},
                        'distance': results.get('distances', [[]])[0][i] if results.get('distances') else 0
                    })
            
            logger.info(f"✅ Found {len(similar)} similar itineraries")
            return similar
            
        except Exception as e:
            logger.error(f"❌ Vector search error: {e}")
            return []
    
    def count(self) -> int:
        """Get count of stored itineraries"""
        if not self.collection:
            return 0
        
        try:
            return self.collection.count()
        except:
            return 0
    
    def get_or_create_collection(self, collection_name: str):
        """Get or create a ChromaDB collection"""
        if not self.client:
            logger.warning("⚠️ ChromaDB client not available")
            return None
        
        try:
            # Try to get existing collection
            collection = self.client.get_collection(collection_name)
            logger.info(f"✅ Collection '{collection_name}' loaded")
            return collection
        except:
            # Create new collection if it doesn't exist
            try:
                collection = self.client.create_collection(
                    name=collection_name,
                    metadata={"description": f"Collection: {collection_name}"}
                )
                logger.info(f"✅ Collection '{collection_name}' created")
                return collection
            except Exception as e:
                logger.error(f"❌ Error creating collection '{collection_name}': {e}")
                return None

# Global instance
vector_store = VectorStore()

