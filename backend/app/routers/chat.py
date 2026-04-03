from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.db import semantic_search
import os
from groq import Groq
from fastapi.responses import JSONResponse
import json

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatQuery(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/chat")
def perform_chat(req: ChatQuery):
    if not os.environ.get("GROQ_API_KEY"):
        return JSONResponse(status_code=500, content={"error": "GROQ_API_KEY not set"})
        
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    # 1. Retrieve Context from ChromaDB using the last message as semantic search
    results = semantic_search(req.message, n_results=10)
    context_docs = []
    sources = []
    
    if results and results["ids"] and len(results["ids"][0]) > 0:
        for i in range(len(results["ids"][0])):
            context_docs.append(results["documents"][0][i])
            doc_id = results["ids"][0][i]
            author = results["metadatas"][0][i].get("author", "unknown_author")
            sub = results["metadatas"][0][i].get("subreddit", "unknown")
            sources.append({"id": doc_id, "author": author, "subreddit": sub})
            
    # 2. Construct Prompt with context
    system_prompt = """You are NarrativeScope, an investigative social media dashboard assistant. 
    You are analyzing narratives. Use the provided context extracted from social media posts to answer the user's question. 
    Be objective and cite your sources. If you don't know the answer based on the context, say you don't know and suggest what the user could search for instead."""
    
    context_text = "\n\n---\n\n".join(context_docs)
    
    # 3. Build history for Groq
    groq_history = [{"role": "system", "content": system_prompt}]
    for msg in req.history:
        groq_history.append({
            "role": "assistant" if msg.role in ["assistant", "model"] else "user",
            "content": msg.content
        })
        
    prompt_with_context = f"CONTEXT:\n{context_text}\n\nUSER QUESTION: {req.message}"
    groq_history.append({"role": "user", "content": prompt_with_context})
        
    try:
        response = client.chat.completions.create(
            messages=groq_history,
            model="meta-llama/llama-4-scout-17b-16e-instruct"
        )
        
        reply_text = response.choices[0].message.content
        
        # 4. Generate 3 suggested queries
        suggested_prompt = f"Based on the conversation and the context, generate exactly 3 short follow-up search queries as a JSON array of strings. Do not use Markdown formatting, just output the array."
        
        sg_history = groq_history + [
            {"role": "assistant", "content": reply_text},
            {"role": "user", "content": suggested_prompt}
        ]
        
        sg_res = client.chat.completions.create(
            messages=sg_history,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            response_format={"type": "json_object"} if False else None # Optional strict JSON if supported, falling back to manual
        )
        
        try:
            raw_sg = sg_res.choices[0].message.content.replace('```json', '').replace('```', '').strip()
            suggestions = json.loads(raw_sg)
            if isinstance(suggestions, dict):
                # Handle case where model returns {"queries": [...]}
                suggestions = list(suggestions.values())[0]
        except:
            suggestions = ["What are other narratives?", "Who are the key actors?", "How has sentiment changed?"]
            
        return {
            "reply": reply_text,
            "sources": sources[:5], # Send top 5 sources back for UI citation
            "suggested_queries": suggestions[:3] if isinstance(suggestions, list) else []
        }
        
    except Exception as e:
        print("Chat API Error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
