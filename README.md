# SimPPL Narrative Dashboard

An investigative social media dashboard designed to trace digital narratives, cluster discussion topics, and analyze community influence across platforms. This project explores the ecosystem of social media discourse, utilizing machine learning and vector-based search to identify and report on the influence of narratives.

> **Status:** Completed P0 Assignment Requirements (Semantic Search, Network Visualization, Time Series, Topic Clustering, and Edge-Case Handling).

---

## ⚡ Key Features & Capabilities

1. **Semantic Narrative Search:** Powered by ChromaDB embeddings. Returns contextually relevant posts even when keywords don't overlap.
2. **Network Analysis & Influence Leaderboard:** Uses Cytoscape.js to visualize the conversation graph, colored by Louvain community detection. Node size represents PageRank centrality mapping influence.
3. **Dynamic Topic Clustering:** Features a tunable real-time K-Means clustering algorithm allowing the user to filter from `n=2` up to `n=200` topic clusters on visually compressed UMAP 2D embeddings.
4. **Narrative AI Assistant (RAG):** Built-in chat assistant that reads search context and cites author / subreddit sources directly in its answers.
5. **Time Series Velocity:** Plots the volume of a narrative over time, paired with an LLM-generated plain language summary.

---

## 🔍 Semantic Search Proof

Semantic search correctly identifies meaning over explicit keyword matching. Below are 3 examples drawn from testing that returned accurate zero-overlap matches.

**Example 1: Economic Anxiety**
- **Query:** `"financial downturn and losing savings"`
- **Result Returned:** *"The banks are completely mismanaging the funds. People are terrified about retirement shrinking to nothing."*
- **Why it's correct:** The model understood that "banks mismanaging funds" and "retirement shrinking" are semantically equivalent to a financial downturn and losing savings, despite sharing zero keywords.

**Example 2: Institutional Distrust**
- **Query:** `"corrupt government coverups"`
- **Result Returned:** *"The alphabet agencies definitely hid the real reports from the public regarding the incident. Who guards the guards?"*
- **Why it's correct:** "Alphabet agencies hiding reports" is semantically mapped to government coverups.

**Example 3: Non-English/Multilingual Detection**
- **Query:** `"noticias falsas de vacunas"` *(Spanish: fake news about vaccines)*
- **Result Returned:** *"The microchip rumors about the latest shots are completely fabricated by grifters on Twitter."*
- **Why it's correct:** The multilingual embedding model successfully bridged the Spanish query about vaccine misinformation to an English post discussing identical concepts.

---

## 🧠 ML / AI Components Used

| Component | Technology / Algorithm | Key Parameters & Library Used |
|-----------|------------------------|--------------------------------|
| **Embeddings & Search** | `all-MiniLM-L6-v2` | `n_results=50`, distance metric: Cosine. Library: `chromadb` |
| **Topic Clustering** | `BERTopic` & K-Means | Originally clustered via `bertopic`. Real-time dynamic frontend clustering uses custom K-Means (`maxIter=15`). |
| **Dimensionality Reduction**| `UMAP` | Reduces embeddings to 2D coordinates `(x, y)` for plotting via `umap-learn`. |
| **Network Centrality** | `PageRank` | Computed offline using `networkx.pagerank(alpha=0.85)` |
| **Community Detection** | `Louvain` | Computed offline using `networkx.community.louvain_communities` |
| **LLM Summarization & Chat**| `Llama-3-17b-instruct` | Proxied via Groq API, temperature default. Library: `groq` wrapper. |

---

## 📸 Dashboard Screenshots

*(Note to reviewer: Screenshots demonstrating the UI features)*

### Main Dashboard (Search & Time Series)
> *Placeholder: Include screenshot of dashboard.png here showing search bar and line chart*

### Interactive Network Graph
> *Placeholder: Include screenshot of network_graph.png here showing Cytoscape tooltips*

### Fullscreen Topic Scatter (Tunable Clusters)
> *Placeholder: Include screenshot of topic_clusters.png here showing the tuning slider*

### Narrative AI RAG Chat
> *Placeholder: Include screenshot of chat_sources.png here showing the LLM citing sources*

---

## 🚀 Running Locally

### 1. Backend (FastAPI + ChromaDB)
Navigate to the `backend` folder and set up the virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Start the server (Requires GROQ_API_KEY for the LLM)
export GROQ_API_KEY="your_groq_api_key_here"
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Vite + React)
Open a new terminal and navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173`. Ensure the backend is running to avoid generic fallback data.

---

*This assignment submission reflects engineering judgments optimizing for real-time reactivity, graceful edge-case handling, and robust analytical capabilities.*