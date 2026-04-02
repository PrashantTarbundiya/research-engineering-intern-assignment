import json
import chromadb
from sentence_transformers import SentenceTransformer
import time
import os

def build_embeddings(input_file, chroma_dir):
    print("Loading Sentence Transformer model...")
    # Load a fast semantic search model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Initialize local ChromaDB
    print(f"Initializing ChromaDB at {chroma_dir}...")
    os.makedirs(chroma_dir, exist_ok=True)
    client = chromadb.PersistentClient(path=chroma_dir)
    
    # Recreate collection to avoid duplicates during dev
    try:
        client.delete_collection(name="reddit_posts")
    except Exception:
        pass # Collection doesn't exist
        
    collection = client.create_collection(
        name="reddit_posts",
        metadata={"hnsw:space": "cosine"} # Semantic search
    )
    
    # Read the data
    documents = []
    metadatas = []
    ids = []
    
    print(f"Reading data from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            if not line.strip(): continue
            record = json.loads(line)
            
            # Using full text (title + selftext)
            text = record.get("text", "")
            if len(text) < 10: continue
            
            # Subreddit can be null sometimes, coerce to string
            sub = record.get("subreddit", "unknown")
            if sub is None: sub = "unknown"
            author = record.get("author", "unknown")
            if author is None: author = "unknown"

            documents.append(text)
            ids.append(record.get("id"))
            
            metadatas.append({
                "author": author,
                "subreddit": sub,
                "created_utc": record.get("created_utc", 0),
                "score": record.get("score", 0),
                "url": record.get("url", "")
            })
            
    print(f"Loaded {len(documents)} valid records. Encoding...")
    
    # Batch encode + add to ChromaDB
    BATCH_SIZE = 500
    start_time = time.time()
    for i in range(0, len(documents), BATCH_SIZE):
        end_idx = i + BATCH_SIZE
        batch_docs = documents[i:end_idx]
        batch_ids = ids[i:end_idx]
        batch_meta = metadatas[i:end_idx]
        
        # sentence-transformers outputs numpy arrays, chroma wants lists of floats
        embeddings = model.encode(batch_docs, show_progress_bar=False).tolist()
        
        collection.add(
            ids=batch_ids,
            embeddings=embeddings,
            documents=batch_docs,
            metadatas=batch_meta
        )
        print(f"Indexed {end_idx}/{len(documents)}...")
        
    print(f"Embedding and indexing complete in {time.time() - start_time:.2f} seconds.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, "data", "cleaned_data.jsonl")
    db_path = os.path.join(base_dir, "data", "chroma_db")
    build_embeddings(input_path, db_path)
