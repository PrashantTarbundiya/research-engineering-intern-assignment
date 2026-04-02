from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ..services.db import semantic_search
import json
import os
import google.generativeai as genai
from collections import defaultdict
from datetime import datetime

router = APIRouter()

class AnalyticsQuery(BaseModel):
    query: str
    limit: Optional[int] = 500
    filters: Optional[Dict[str, Any]] = None

@router.post("/timeseries")
async def timeseries_analytics(req: AnalyticsQuery):
    # Semantic Search to get the relevant posts
    results = semantic_search(req.query, n_results=req.limit, where_filter=req.filters)
    
    if not results or not results["ids"] or len(results["ids"][0]) == 0:
        return {"data": [], "summary": "No data available for this query."}
        
    metadatas = results["metadatas"][0]
    texts = results["documents"][0]
    
    # Bucket by day or week
    daily_counts = defaultdict(int)
    total_sentiment = 0 # Future expansion
    
    for m in metadatas:
        ts = m.get("created_utc", 0)
        if ts:
            dt = datetime.fromtimestamp(ts)
            date_str = dt.strftime("%Y-%m-%d")
            daily_counts[date_str] += 1
            
    # Sort
    sorted_data = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]
    
    # Ask Gemini for a one-line summary
    # Use API key from environment variable
    summary = "Analysis unavailable."
    if os.environ.get("GEMINI_API_KEY"):
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        try:
            model = genai.GenerativeModel("gemini-3-flash-preview")
            top_texts = texts[:10]  # Just give it a sample of 10 posts
            prompt = f"Given a user searched for '{req.query}' and these top posts: {json.dumps(top_texts)}, write a 1-sentence analytical summary explaining the narrative trend or key talking point."
            response = model.generate_content(prompt)
            summary = response.text
        except Exception as e:
            print("Gemini API Error (Analytics):", e)
            
    return {"data": sorted_data, "summary": summary.strip()}

@router.get("/topics")
def get_topics(min_size: int = 15):
    # This reads the pre-computed BERTopic clustering JSON
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    topics_path = os.path.join(base_dir, "data", "topic_assignments.json")
    
    try:
        with open(topics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return {"topics": {}, "points": []}
