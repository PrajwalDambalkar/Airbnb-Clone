# routes/admin_routes.py
from fastapi import APIRouter, HTTPException
from rag.policy_loader import policy_loader
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/ingest-policies")
async def ingest_policies():
    """
    Manually trigger policy document ingestion
    Use this whenever policy documents are updated
    """
    try:
        logger.info("🔄 Manual policy ingestion triggered via API")
        policy_loader.ingest_policies()
        
        return {
            "success": True,
            "message": "Policy documents ingested successfully"
        }
    except Exception as e:
        logger.error(f"❌ Policy ingestion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest policies: {str(e)}"
        )

@router.get("/search-policies")
async def search_policies(query: str, n_results: int = 3):
    """
    Test policy search functionality
    
    Example: GET /admin/search-policies?query=cancellation&n_results=3
    """
    try:
        logger.info(f"🔍 Testing policy search: '{query}'")
        results = policy_loader.search_policies(query, n_results)
        
        return {
            "success": True,
            "query": query,
            "results_count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"❌ Policy search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/policy-stats")
async def get_policy_stats():
    """Get statistics about loaded policies"""
    try:
        from rag.vector_store import vector_store
        
        collection = vector_store.get_or_create_collection(policy_loader.collection_name)
        count = collection.count()
        
        # Get all unique policy types
        if count > 0:
            results = collection.get(limit=count)
            policy_types = set()
            filenames = set()
            
            if results and results['metadatas']:
                for metadata in results['metadatas']:
                    if 'policy_type' in metadata:
                        policy_types.add(metadata['policy_type'])
                    if 'filename' in metadata:
                        filenames.add(metadata['filename'])
            
            return {
                "success": True,
                "total_chunks": count,
                "policy_types": sorted(list(policy_types)),
                "policy_files": sorted(list(filenames))
            }
        else:
            return {
                "success": True,
                "total_chunks": 0,
                "policy_types": [],
                "policy_files": [],
                "message": "No policies loaded yet. Use /admin/ingest-policies to load them."
            }
            
    except Exception as e:
        logger.error(f"❌ Failed to get policy stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stats: {str(e)}"
        )

