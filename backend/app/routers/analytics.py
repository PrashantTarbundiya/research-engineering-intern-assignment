from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.db import semantic_search
from langdetect import detect as detect_lang, LangDetectException
import json
import os
from groq import Groq
from collections import defaultdict
from datetime import datetime

router = APIRouter()

class AnalyticsQuery(BaseModel):
    query: str
    limit: Optional[int] = 500
    filters: Optional[Dict[str, Any]] = None

@router.post("/timeseries")
async def timeseries_analytics(req: AnalyticsQuery):

    detected_lang = "unknown"
    try:
        detected_lang = detect_lang(req.query)
    except LangDetectException:
        detected_lang = "unknown"

    # Semantic Search to get the relevant posts
    results = semantic_search(req.query, n_results=req.limit, where_filter=req.filters)

    if not results or not results["ids"] or len(results["ids"][0]) == 0:
        non_english_hint = (
            "Note: This dataset contains primarily English posts. "
            "Non-English queries may return limited results due to cross-lingual embedding."
            if detected_lang not in ("en", "unknown") and len(detected_lang) <= 3
            else ""
        )
        return {"data": [], "summary": "No data available for this query." + (" " + non_english_hint if non_english_hint else "")}

    metadatas = results["metadatas"][0]
    texts = results["documents"][0]

    # Bucket by day
    daily_counts = defaultdict(int)

    for m in metadatas:
        ts = m.get("created_utc", 0)
        # Handle string timestamps or varying scale (Twitter vs Reddit)
        try:
            ts = float(ts)
            # If timestamp is in ms, convert to seconds
            if ts > 3000000000:
                ts = ts / 1000
        except (ValueError, TypeError):
            ts = 0

        if ts > 0:
            dt = datetime.fromtimestamp(ts)
            date_str = dt.strftime("%Y-%m-%d")
            daily_counts[date_str] += 1

    # Sort
    sorted_data = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]

    # Ask Groq AI for a one-line summary
    summary = "Analysis unavailable."
    if os.environ.get("GROQ_API_KEY"):
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            top_texts = texts[:20]
            prompt = f"""You are an investigative analyst summarizing social media trends for a general audience.

A user searched for: "{req.query}"
You found {len(texts)} relevant posts. Here is a sample:

{json.dumps(top_texts, ensure_ascii=False)}

Write a concise summary in exactly 3-4 lines that:
1. Explain what this topic is about and what people are saying.
2. Highlight the main theme or shared concern visible in the posts.
3. Note the overall tone or pattern.

Keep it simple, jargon-free, and easy for anyone to understand."""

            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="meta-llama/llama-4-scout-17b-16e-instruct"
            )
            summary = response.choices[0].message.content
        except Exception as e:
            print("Groq API Error (Analytics):", e)

    return {"data": sorted_data, "summary": summary.strip()}

@router.get("/topics")
def get_topics(min_size: int = 15):
    # This reads the pre-computed BERTopic clustering JSON
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    topics_path = os.path.join(base_dir, "data", "topic_assignments.json")

    try:
        with open(topics_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Filter topics by minimum cluster size
        all_topics = data.get("topics", {})
        all_points = data.get("points", [])

        # Count points per topic
        topic_counts = defaultdict(int)
        for point in all_points:
            topic_id = str(point.get("topic", -1))
            topic_counts[topic_id] += 1

        # Keep only topics meeting min_size threshold
        filtered_topic_ids = {
            topic_id for topic_id, count in topic_counts.items()
            if count >= min_size
        }

        # Filter topics dict and points
        filtered_topics = {
            topic_id: label for topic_id, label in all_topics.items()
            if topic_id in filtered_topic_ids
        }
        filtered_points = [
            point for point in all_points
            if str(point.get("topic", -1)) in filtered_topic_ids
        ]

        return {
            "topics": filtered_topics,
            "points": filtered_points,
            "cluster_sizes": {k: v for k, v in sorted(topic_counts.items(), key=lambda x: -x[1]) if k in filtered_topic_ids}
        }
    except FileNotFoundError:
        return {"topics": {}, "points": []}
