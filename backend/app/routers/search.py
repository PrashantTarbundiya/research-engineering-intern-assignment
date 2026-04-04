from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.db import semantic_search
from langdetect import detect as detect_lang, LangDetectException

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 50
    filters: Optional[Dict[str, Any]] = None

@router.post("/search")
def perform_search(req: SearchQuery):
    if not req.query or len(req.query.strip()) < 2:
        return {"results": [], "detected_lang": "unknown", "lang_warning": None}

    
    detected_lang = "unknown"
    try:
        detected_lang = detect_lang(req.query)
    except LangDetectException:
        detected_lang = "unknown"

   
    lang_warning = None
    if detected_lang not in ("en", "unknown") and len(detected_lang) <= 3:
        lang_warning = "The dataset contains primarily English posts. Results may be limited for non-English queries."

    # Chroma filter syntax applies directly
    results = semantic_search(req.query, n_results=req.limit, where_filter=req.filters)

    formatted_results = []

    if results and results["ids"] and len(results["ids"]) > 0:
        for i in range(len(results["ids"][0])):
            formatted_results.append({
                "id": results["ids"][0][i],
                "text": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if "distances" in results else None
            })

    return {"results": formatted_results, "detected_lang": detected_lang, "lang_warning": lang_warning}
