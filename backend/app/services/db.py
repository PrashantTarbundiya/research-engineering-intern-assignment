import chromadb
import chromadb.config
import os

_client = None
_collection = None


def get_chroma_client():
    global _client, _collection
    if _client is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        chroma_path = os.path.join(base_dir, "data", "chroma_db")

        if os.environ.get("CHROMA_PERSIST_DIR"):
            chroma_path = os.environ.get("CHROMA_PERSIST_DIR")

        try:
            settings = chromadb.config.Settings(
                is_persistent=True,
                persist_directory=chroma_path,
                allow_reset=True,
            )
            _client = chromadb.Client(settings)
        except Exception as e:
            # Fallback: if settings change fails, try direct PersistentClient
            _client = chromadb.PersistentClient(path=chroma_path)

        try:
            _collection = _client.get_collection(name="reddit_posts")
        except ValueError:
            print("WARNING: 'reddit_posts' collection not found in ChromaDB! Run build_embeddings.py first.")
            _collection = _client.create_collection(name="reddit_posts")
        except Exception as e:
            print(f"WARNING: Failed to open 'reddit_posts' collection: {e}")
            _collection = _client.create_collection(name="reddit_posts")


def semantic_search(query_text, n_results=50, where_filter=None):
    collection = get_chroma_client()

    global _embedder
    if '_embedder' not in globals():
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer('all-MiniLM-L6-v2')

    query_emb = _embedder.encode([query_text]).tolist()

    results = collection.query(
        query_embeddings=query_emb,
        n_results=n_results,
        where=where_filter
    )

    return results
