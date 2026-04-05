# AI Prompts History

This file contains the prompts used during the development of this project, as required by the assignment instructions.

| #   | Component | Prompt | Issue with Output | How it was fixed |
| --- | --------- | ------ | ----------------- | ---------------- |
| 1   | Data cleaning — `scripts/preprocess.py` | "clean raw Reddit posts: remove URLs, detect language, compute VADER sentiment, export JSONL" | URLs extracted but not removed; no sentiment or language detection | Added regex URL removal + `langdetect` tagging + VADER scoring (commit: 7590cfd) |
| 2   | Embeddings — `scripts/build_embeddings.py` | "encode cleaned posts with `all-MiniLM-L6-v2` and store in `data/chroma_db/`" | — | — |
| 3   | Graph analytics — `scripts/build_graph.py` | "build NetworkX graph, compute PageRank + Betweenness, run Louvain, export JSON" | Betweenness centrality missing; DiGraph was directed | Added `nx.betweenness_centrality`; converted graph to undirected before Louvain (commit: 0f46965) |
| 4   | Topic modeling — `scripts/train_topics.py` | "train BERTopic with HDBSCAN `min_topic_size=15`, UMAP 2D, export topic assignments" | — | — |
| 5   | FastAPI app — `backend/app/main.py` | "create FastAPI app with CORS for frontend origin" | — | — |
| 6   | `/api/search` — `routers/search.py` | "query ChromaDB for top-50 semantic matches with cosine scores" | — | — |
| 7   | `/api/timeseries` + `/api/topics` — `routers/analytics.py` | "aggregate time-series counts and list topics with 2D UMAP arrays" | `/api/topics` received `min_size` but didn't filter | Added cluster filtering using the `min_size` parameter |
| 8   | `/api/network` — `routers/network.py` | "return Cytoscape-compatible nodes/edges with PageRank + community fields" | — | — |
| 9   | `/api/chat` — `routers/chat.py` | "retrieve ChromaDB context, send to Groq Llama-70b, return response with cited sources" | — | — |
| 10  | Frontend — `App.jsx` + Vite + Tailwind | "init React+Vite app with TailwindCSS, Router with LandingPage, DashboardPage, AnalyticsPage" | — | — |
| 11  | `NetworkGraph.jsx` + `TopicScatter.jsx` | "Cytoscape network with community coloring + K-Means scatter with 2–200 cluster slider" | Slider wasn't reactive | Moved K-Means to client-side on UMAP 2D for real-time re-clustering |
| 12  | Search + `ChatPanel.jsx` integration | "search bar + chat UI that reactively sync time-series, graph, and topic charts" | Search didn't trigger chart re-renders | Added global state in `DashboardPage` to propagate search results to all child components |
| 13  | Docker deployment — `Dockerfile` | "Dockerize FastAPI app, pre-download embedding model during build, lazy-load at runtime for 512MB limit" | Initial build exceeded 512MB — embedding model downloading at runtime bloated container | Moved `SentenceTransformer` preload into Dockerfile `RUN` step, model loaded from cache at startup |
| 14  | Groq deployment — chat timeout + preload | "fix chat endpoint timeout on Render/free-tier caused by embedding model cold start" | Model loaded on every request causing 30s timeout; Groq calls failing during warm-up | Pre-loaded embedding model at server startup (lifespan event) with timeout fallback + error handling |
| 15  | Rate limiting — `/api/search` + `/api/chat` | "add rate limiting to protect free-tier Groq API quota and prevent abuse" | No throttling — rapid queries exhausted Groq rate limits, crashing the backend | Added simple in-memory rate limiter decorator (requests/minute cap) on search and chat endpoints |
