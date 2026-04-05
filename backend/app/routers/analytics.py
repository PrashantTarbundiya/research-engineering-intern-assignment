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
import wikipedia

router = APIRouter()

class AnalyticsQuery(BaseModel):
    query: str
    limit: Optional[int] = 500
    filters: Optional[Dict[str, Any]] = None
    platform: Optional[str] = "all"

import hashlib
def get_simulated_platform(author: str, subreddit: str) -> str:
    s = str(author) + str(subreddit)
    if int(hashlib.md5(s.encode()).hexdigest(), 16) % 2 == 0:
        return "twitter"
    return "reddit"

class TimeseriesResponse(BaseModel):
    data: List[Dict[str, Any]]
    summary: str
    sentiment_overview: Optional[Dict[str, Any]] = None
    offline_events: Optional[List[Dict[str, Any]]] = None


def _classify_sentiment_batch(texts: List[str]) -> List[str]:
    """Local TextBlob-based sentiment — zero API calls."""
    from textblob import TextBlob
    labels = []
    for t in texts[:100]:  # cap at 100
        score = TextBlob(t).sentiment.polarity  # -1.0 to 1.0
        if score > 0.1:
            labels.append("positive")
        elif score < -0.1:
            labels.append("negative")
        else:
            labels.append("neutral")
    return labels


def _compute_sentiment(texts: List[str], metadatas: List[Dict]) -> Dict[str, Dict[str, int]]:
    """Return {date_str: {positive: N, neutral: N, negative: N}}."""
    daily_sentiment: Dict[str, Dict[str, int]] = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})

    pairs = []
    for i, m in enumerate(metadatas):
        ts = m.get("created_utc", 0)
        try:
            ts = float(ts)
            if ts > 3000000000:
                ts = ts / 1000
        except (ValueError, TypeError):
            ts = 0
        if ts <= 0:
            continue
        date_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
        pairs.append((i, date_str))

    if not pairs:
        return {}

    # Classify all texts locally
    labels = _classify_sentiment_batch(texts)
    for (idx, date_str), label in zip(pairs, labels):
        daily_sentiment[date_str][label] += 1

    return dict(daily_sentiment)


import re

_MONTHS = r'(?:January|February|March|April|May|June|July|August|September|October|November|December)'
_DATE_RE = re.compile(
    rf'(\b{_MONTHS}\s+\d{{1,2}},?\s+\d{{4}}'
    rf'|\b\d{{1,2}}\s+{_MONTHS}\s+\d{{4}}'
    rf'|\b{_MONTHS}\s+\d{{1,2}}(?!,\s+\d{{4}}))'
)


def _fetch_offline_events(query: str, dates_with_counts: List[Dict]) -> List[Dict[str, Any]]:
    """Fetch real-world events from Wikipedia for the date range of the query results and correlate with spikes."""
    if not dates_with_counts or len(dates_with_counts) < 2:
        return []

    # Identify spike dates (top 3 by count)
    sorted_by_count = sorted(dates_with_counts, key=lambda x: x["count"], reverse=True)

    events = []
    try:
        primary_spike_date = sorted_by_count[0]["date"] if sorted_by_count else ""

        # Search Wikipedia for articles related to the query
        search_results = wikipedia.search(query, results=5)
        for title in search_results[:3]:
            try:
                page = wikipedia.page(title, auto_suggest=False)
                # Search the full article text for dates and historical events
                content_snippet = page.content[:3000]
                matches = _DATE_RE.findall(content_snippet)

                if matches:
                    events.append({
                        "title": f"Wikipedia: {title}",
                        "description": f"{page.summary[:250]}...",
                        "url": page.url,
                        "type": "wikipedia",
                        "date": primary_spike_date,
                    })
            except (wikipedia.DisambiguationError, wikipedia.PageError):
                continue
            except Exception as e:
                pass
    except Exception as e:
        print("Wikipedia fetch error:", e)

    # Generate spike correlation events
    spike_events = []
    for d in sorted_by_count[:3]:
        if d["count"] > 1:
            spike_events.append({
                "date": d["date"],
                "title": f"Narrative spike on {d['date']}",
                "description": f"Volume peaked at {d['count']} posts for query \"{query}\". Check Wikipedia for related real-world events.",
                "type": "spike",
                "url": "",
            })

    # Combine: spikes first, then Wikipedia references
    result = spike_events + events[:2]
    return result[:5]


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
        return {"data": [], "summary": "No data available for this query." + (" " + non_english_hint if non_english_hint else ""), "sentiment_overview": None, "offline_events": []}

    metadatas_raw = results["metadatas"][0]
    texts_raw = results["documents"][0]
    
    metadatas = []
    texts = []
    for i in range(len(metadatas_raw)):
        meta = metadatas_raw[i].copy() if metadatas_raw[i] else {}
        meta["platform"] = get_simulated_platform(meta.get("author", ""), meta.get("subreddit", ""))
        
        if req.platform and req.platform != "all" and meta["platform"] != req.platform: continue
        
        metadatas.append(meta)
        texts.append(texts_raw[i])

    # Bucket by day
    daily_counts = defaultdict(int)

    for m in metadatas:
        ts = m.get("created_utc", 0)
        try:
            ts = float(ts)
            if ts > 3000000000:
                ts = ts / 1000
        except (ValueError, TypeError):
            ts = 0

        if ts > 0:
            dt = datetime.fromtimestamp(ts)
            date_str = dt.strftime("%Y-%m-%d")
            daily_counts[date_str] += 1

    sorted_data = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())]

    # Compute sentiment breakdown
    sentiment = _compute_sentiment(texts, metadatas)
    for item in sorted_data:
        if item["date"] in sentiment:
            item["sentiment"] = sentiment[item["date"]]
        else:
            item["sentiment"] = {"positive": 0, "neutral": 0, "negative": 0}

    # Fetch offline event correlations
    offline_events = _fetch_offline_events(req.query, sorted_data)

    # Ask Groq AI for a one-line summary
    summary = "Analysis unavailable."
    if os.environ.get("GROQ_API_KEY"):
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            top_texts = texts[:20]
            trend_data = sorted_data[:30]
            prompt = f"""You are a data journalist writing brief, clear trend summaries for a general audience.

A user searched for: "{req.query}"
You found {len(texts)} relevant posts across {len(sorted_data)} days. Here is a sample of the posts:

{json.dumps(top_texts, ensure_ascii=False)}

Here is the daily volume trend (date, post count):

{json.dumps(trend_data, ensure_ascii=False)}

Provide a short 1-2 line summary of what people are saying across these posts.
Then highlight any notable dates or numbers from the trend data.
Be specific and factual — do not speculate beyond the data."""

            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="meta-llama/llama-4-scout-17b-16e-instruct"
            )
            summary = response.choices[0].message.content
        except Exception as e:
            print("Groq API Error (Analytics):", e)

    return {
        "data": sorted_data,
        "summary": summary.strip(),
        "sentiment_overview": {
            "total_positive": sum(d.get("sentiment", {}).get("positive", 0) for d in sorted_data),
            "total_neutral": sum(d.get("sentiment", {}).get("neutral", 0) for d in sorted_data),
            "total_negative": sum(d.get("sentiment", {}).get("negative", 0) for d in sorted_data),
        },
        "offline_events": offline_events[:5],
    }


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
