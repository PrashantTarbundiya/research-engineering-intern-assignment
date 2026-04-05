FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model during build to save memory/time at runtime
ENV HF_HOME=/app/hf_cache
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"


# Copy the application code
COPY backend/ .

# Copy the data directory (ChromaDB + topic data) into the container
COPY data/ /data/
ENV CHROMA_PERSIST_DIR=/data/chroma_db

# Expose the API port
EXPOSE 8000

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
