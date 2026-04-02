import chromadb
import os

_client = None
_collection = None

def get_chroma_client():
    global _client, _collection
    if _client is None:
        # Resolve the relative path so it works from anywhere
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        chroma_path = os.path.join(base_dir, "data", "chroma_db")
        
        # In production this might be different
        if os.environ.get("CHROMA_PERSIST_DIR"):
            chroma_path = os.environ.get("CHROMA_PERSIST_DIR")
            
        _client = chromadb.PersistentClient(path=chroma_path)
        try:
            _collection = _client.get_collection(name="reddit_posts")
        except ValueError:
            print("WARNING: 'reddit_posts' collection not found in ChromaDB! Run build_embeddings.py first.")
            # Create an empty one just to prevent crashes
            _collection = _client.create_collection(name="reddit_posts")

    return _collection

def semantic_search(query_text, n_results=50, where_filter=None):
    collection = get_chroma_client()
    
    # We must construct the query and encode it. But wait, ChromaDB can use the built-in embedding function, 
    # but since we used sentence-transformers directly, we MUST pass the query embedding OR load the model.
    # To keep the API fast and free of huggingface loading on every request, we load the embedding model in memory.
    
    from sentence_transformers import SentenceTransformer
    # We could make this a singleton too, but sentence-transformers has some clever caching anyway.
    # Let's use a global singleton for the embedder.
    global _embedder
    if '_embedder' not in globals():
        _embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
    query_emb = _embedder.encode([query_text]).tolist()
    
    # Perform vector search
    results = collection.query(
        query_embeddings=query_emb,
        n_results=n_results,
        where=where_filter
    )
    
    return results
