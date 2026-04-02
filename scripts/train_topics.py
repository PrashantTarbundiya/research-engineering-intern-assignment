import json
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import os
import time

def train_topics(input_file, output_model_dir, output_json):
    print("Loading Sentence Transformer model for Topci modeling...")
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    
    docs = []
    ids = []
    metadatas = []
    
    print(f"Reading data from {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as fin:
        for line in fin:
            if not line.strip(): continue
            record = json.loads(line)
            
            text = record.get("text", "")
            if len(text) < 10: continue
            
            docs.append(text)
            ids.append(record.get("id"))
            
            metadatas.append({
                "author": record.get("author", "unknown"),
                "subreddit": record.get("subreddit", "unknown"),
                "created_utc": record.get("created_utc", 0),
            })
            
    print(f"Loaded {len(docs)} documents. Training BERTopic (this may take a few minutes)...")
    
    start_time = time.time()
    
    # We use UMAP to project embeddings to 2D for the UI visualization as well as clustering
    from umap import UMAP
    from hdbscan import HDBSCAN
    
    # We want 2D embeddings for the UI right away
    umap_model = UMAP(n_neighbors=15, n_components=2, min_dist=0.0, metric='cosine', random_state=42)
    hdbscan_model = HDBSCAN(min_cluster_size=15, metric='euclidean', cluster_selection_method='eom', prediction_data=True)
    
    topic_model = BERTopic(
        embedding_model=embedding_model,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model,
        min_topic_size=15,
        verbose=True
    )
    
    # Extract topics and 2D embeddings
    topics, probs = topic_model.fit_transform(docs)
    
    print(f"BERTopic training complete in {time.time() - start_time:.2f} seconds.")
    
    os.makedirs(output_model_dir, exist_ok=True)
    try:
        topic_model.save(os.path.join(output_model_dir, "model_dir"), serialization="safetensors", save_ctfidf=True)
    except:
        pass
    
    # Get 2D embeddings for frontend UI scatter plot visualization
    # UMAP model is stored inside the topic model
    embeddings2d = topic_model.umap_model.embedding_
    
    # Get the topic descriptions
    topic_info = topic_model.get_topic_info()
    topic_labels = {}
    for index, row in topic_info.iterrows():
        # Top words as label
        topic = row['Topic']
        name = row['Name'] # BERTopic generates an automatic name
        if topic == -1:
            topic_labels[topic] = "Outliers"
        else:
            # Name format: "Topic_Word1_Word2..." -> Clean it up to just Words
            words = name.split('_')[1:]
            topic_labels[topic] = ", ".join(words[:4])
            
    print(f"Found {len(topic_labels)} topics.")
    
    # Export topics and 2D points to JSON
    output_data = {
        "topics": topic_labels,
        "points": []
    }
    
    for i, doc_id in enumerate(ids):
        # We handle index out of bounds just in case
        try:
            x, y = float(embeddings2d[i][0]), float(embeddings2d[i][1])
            topic_id = int(topics[i])
            
            output_data["points"].append({
                "id": doc_id,
                "x": x,
                "y": y,
                "topic": topic_id,
                "text": docs[i][:150] + "..." if len(docs[i]) > 150 else docs[i],
                "subreddit": metadatas[i]["subreddit"]
            })
        except IndexError:
            pass
            
    with open(output_json, 'w', encoding='utf-8') as fout:
        json.dump(output_data, fout, indent=2)
        
    print(f"Saved topics JSON to {output_json}!")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, "data", "cleaned_data.jsonl")
    model_dir = os.path.join(base_dir, "data", "bertopic_model")
    output_path = os.path.join(base_dir, "data", "topic_assignments.json")
    train_topics(input_path, model_dir, output_path)
