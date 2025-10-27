import os
import logging
from typing import List, Dict
from pathlib import Path
from rag.vector_store import vector_store
from rag.embeddings import embedding_service

logger = logging.getLogger(__name__)

class PolicyLoader:
    """Load and index policy documents (Markdown, Text, and PDF)"""
    
    def __init__(self):
        self.policies_dir = Path(__file__).parent.parent / "policies"
        self.collection_name = "airbnb_policies"
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                if last_period > chunk_size * 0.7:  # At least 70% through
                    end = start + last_period + 1
                    chunk = text[start:end]
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks
    
    def extract_text_from_pdf(self, filepath: Path) -> str:
        """Extract text from PDF file"""
        try:
            import PyPDF2
            
            text = ""
            with open(filepath, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)
                
                logger.info(f"  📄 Extracting text from PDF: {num_pages} pages")
                
                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    text += page_text + "\n\n"
            
            # Clean up the text
            text = text.replace('\x00', '')  # Remove null bytes
            text = ' '.join(text.split())  # Normalize whitespace
            
            return text
            
        except ImportError:
            logger.error("❌ PyPDF2 not installed. Install with: pip install PyPDF2")
            return ""
        except Exception as e:
            logger.error(f"❌ Error extracting PDF {filepath}: {e}")
            return ""
    
    def load_policy_file(self, filepath: Path) -> Dict:
        """Load a single policy file (supports .md, .txt, .pdf)"""
        try:
            # Extract metadata from filename
            policy_type = filepath.stem.replace('_', ' ').title()
            
            # Handle different file types
            if filepath.suffix.lower() == '.pdf':
                logger.info(f"  📑 Reading PDF: {filepath.name}")
                content = self.extract_text_from_pdf(filepath)
            else:
                # Regular text files (.md, .txt)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            
            if not content or len(content.strip()) == 0:
                logger.warning(f"  ⚠️ Empty content from {filepath.name}")
                return None
            
            return {
                'filename': filepath.name,
                'policy_type': policy_type,
                'content': content,
                'file_type': filepath.suffix.lower()
            }
            
        except Exception as e:
            logger.error(f"❌ Error loading {filepath}: {e}")
            return None
    
    def ingest_policies(self):
        """Load all policy documents into vector store"""
        logger.info("📚 Starting policy ingestion...")
        
        if not self.policies_dir.exists():
            logger.warning(f"⚠️ Policies directory not found: {self.policies_dir}")
            logger.info(f"💡 Creating directory: {self.policies_dir}")
            self.policies_dir.mkdir(parents=True, exist_ok=True)
            return
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        # Support multiple file types
        policy_files = list(self.policies_dir.glob("*.md")) + \
                      list(self.policies_dir.glob("*.txt")) + \
                      list(self.policies_dir.glob("*.pdf"))
        
        if not policy_files:
            logger.warning("⚠️ No policy files found in policies directory")
            logger.info("💡 Supported formats: .md, .txt, .pdf")
            return
        
        logger.info(f"📂 Found {len(policy_files)} policy file(s)")
        
        for policy_file in policy_files:
            logger.info(f"📄 Processing: {policy_file.name}")
            
            policy_data = self.load_policy_file(policy_file)
            if not policy_data:
                continue
            
            # Chunk the policy text
            chunks = self.chunk_text(policy_data['content'])
            
            if not chunks:
                logger.warning(f"  ⚠️ No chunks created from {policy_file.name}")
                continue
            
            for i, chunk in enumerate(chunks):
                # Skip empty chunks
                if not chunk or len(chunk.strip()) < 10:
                    continue
                    
                chunk_id = f"{policy_data['filename']}_{i}"
                
                all_chunks.append(chunk)
                all_metadatas.append({
                    'policy_type': policy_data['policy_type'],
                    'filename': policy_data['filename'],
                    'file_type': policy_data['file_type'],
                    'chunk_index': i,
                    'source': 'policy_document'
                })
                all_ids.append(chunk_id)
            
            logger.info(f"  ✅ Created {len(chunks)} chunks from {policy_file.name}")
        
        if not all_chunks:
            logger.warning("⚠️ No policy chunks to ingest")
            return
        
        # Generate embeddings
        logger.info(f"🔢 Generating embeddings for {len(all_chunks)} chunks...")
        embeddings = embedding_service.encode_batch(all_chunks)
        
        # Store in ChromaDB
        logger.info("💾 Storing in vector database...")
        collection = vector_store.get_or_create_collection(self.collection_name)
        
        # Clear existing policies first (to avoid duplicates)
        try:
            existing_count = collection.count()
            if existing_count > 0:
                logger.info(f"🗑️  Clearing {existing_count} existing policy chunks...")
                collection.delete(where={"source": "policy_document"})
        except Exception as e:
            logger.warning(f"⚠️ Could not clear existing policies: {e}")
        
        # Add new chunks
        collection.add(
            ids=all_ids,
            embeddings=embeddings,
            documents=all_chunks,
            metadatas=all_metadatas
        )
        
        logger.info(f"✅ Ingested {len(all_chunks)} policy chunks from {len(policy_files)} files")
        logger.info(f"📊 Policy types loaded: {list(set([m['policy_type'] for m in all_metadatas]))}")
    
    def search_policies(self, query: str, n_results: int = 3) -> List[Dict]:
        """Search for relevant policy sections"""
        try:
            # Generate query embedding
            query_embedding = embedding_service.encode(query)
            
            # Search vector store
            collection = vector_store.get_or_create_collection(self.collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': results['distances'][0][i] if results['distances'] else None
                    })
            
            logger.info(f"🔍 Found {len(formatted_results)} policy chunks for query: '{query[:50]}...'")
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Policy search error: {e}")
            return []

# Global instance
policy_loader = PolicyLoader()

