# rag/embeddings.py
import logging
from typing import List

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ sentence-transformers not installed")
    EMBEDDINGS_AVAILABLE = False

class EmbeddingService:
    """Generate embeddings for RAG retrieval"""
    
    def __init__(self):
        if EMBEDDINGS_AVAILABLE:
            try:
                # Use lightweight model
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("✅ Embedding model loaded: all-MiniLM-L6-v2")
            except Exception as e:
                logger.error(f"❌ Embedding model load error: {e}")
                self.model = None
        else:
            self.model = None
    
    def encode(self, text: str) -> List[float]:
        """Convert text to embedding vector"""
        if not self.model:
            # Return dummy embedding for testing
            logger.warning("⚠️ Embeddings not available, returning dummy vector")
            return [0.0] * 384  # MiniLM output dimension
        
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"❌ Encoding error: {e}")
            return [0.0] * 384
    
    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        """Convert multiple texts to embeddings"""
        if not self.model:
            return [[0.0] * 384 for _ in texts]
        
        try:
            embeddings = self.model.encode(texts)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error(f"❌ Batch encoding error: {e}")
            return [[0.0] * 384 for _ in texts]

# Global instance
embedding_service = EmbeddingService()

