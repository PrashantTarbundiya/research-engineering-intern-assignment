from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.db import semantic_search
import os
from groq import Groq
from fastapi.responses import JSONResponse
import json

router = APIRouter()

# Pre-initialize Groq client at module load (avoids per-request overhead)
_groq_client = None

def _get_groq_client():
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if api_key:
            _groq_client = Groq(api_key=api_key, timeout=25.0)
    return _groq_client


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatQuery(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/chat")
def perform_chat(req: ChatQuery):
    client = _get_groq_client()
    if not client:
        return JSONResponse(status_code=500, content={"error": "GROQ_API_KEY not set"})

    search_text = req.message
    all_user_msgs = [m.content for m in req.history if m.role == "user"] + [req.message]
    if len(req.message.strip().split()) <= 3 and len(all_user_msgs) > 1:
        search_text = max(all_user_msgs[:-1], key=lambda m: len(m.split()))

    # Retrieve Context from ChromaDB
    results = semantic_search(search_text, n_results=10)
    context_docs = []
    sources = []

    if results and results["ids"] and len(results["ids"][0]) > 0:
        for i in range(len(results["ids"][0])):
            context_docs.append(results["documents"][0][i])
            doc_id = results["ids"][0][i]
            author = results["metadatas"][0][i].get("author", "unknown_author")
            sub = results["metadatas"][0][i].get("subreddit", "unknown")
            sources.append({"id": doc_id, "author": author, "subreddit": sub})

    context_text = "\n\n---\n\n".join(context_docs[:5]) if context_docs else "No relevant posts found for this query."

    # Single Groq call — reply + suggestions in one response to avoid timeout
    system_prompt = f"""You are NarrativeScope, an investigative social media dashboard assistant.
You analyze narratives from social media posts. Use the provided context to answer the user's question.
Be objective, cite your sources, and reference actual post content.

The user searched for: "{search_text}"
Your latest message is: "{req.message}"

If your latest message is a short follow-up (like "yes", "do it", "tell me more"), understand it in the context of our ongoing conversation. Answer based on the social media context, not generically.
If you don't know the answer based on the context, say so and suggest what the user could search for instead.

IMPORTANT: At the very end of your response, on a new line, output exactly this format:
SUGGESTIONS_JSON: ["query1", "query2", "query3"]
These should be 3 short follow-up search queries the user might want to ask next."""

    # Build history for Groq (keep last 6 messages to reduce payload)
    groq_history = [{"role": "system", "content": system_prompt}]
    for msg in req.history[-6:]:
        groq_history.append({
            "role": "assistant" if msg.role in ["assistant", "model"] else "user",
            "content": msg.content
        })

    prompt_with_context = f"CONTEXT (posts matching '{search_text}'):\n{context_text}\n\nUSER QUESTION: {req.message}"
    groq_history.append({"role": "user", "content": prompt_with_context})

    try:
        response = client.chat.completions.create(
            messages=groq_history,
            model="meta-llama/llama-4-scout-17b-16e-instruct"
        )

        raw_reply = response.choices[0].message.content

        # Parse reply and suggestions from single response
        reply_text = raw_reply
        suggestions = ["What are other narratives?", "Who are the key actors?", "How has sentiment changed?"]

        if "SUGGESTIONS_JSON:" in raw_reply:
            parts = raw_reply.split("SUGGESTIONS_JSON:", 1)
            reply_text = parts[0].strip()
            try:
                raw_sg = parts[1].strip().replace('```json', '').replace('```', '').strip()
                parsed = json.loads(raw_sg)
                if isinstance(parsed, list):
                    suggestions = parsed[:3]
                elif isinstance(parsed, dict):
                    suggestions = list(parsed.values())[0][:3]
            except:
                pass

        return {
            "reply": reply_text,
            "sources": sources[:5],
            "suggested_queries": suggestions
        }

    except Exception as e:
        print("Chat API Error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
