from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.db import semantic_search
import os
import google.generativeai as genai
from fastapi.responses import JSONResponse

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatQuery(BaseModel):
    message: str
    history: List[ChatMessage] = []

@router.post("/chat")
def perform_chat(req: ChatQuery):
    if not os.environ.get("GEMINI_API_KEY"):
        return JSONResponse(status_code=500, content={"error": "GEMINI_API_KEY not set"})
        
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    
    # 1. Retrieve Context from ChromaDB using the last message as semantic search
    results = semantic_search(req.message, n_results=10)
    context_docs = []
    sources = []
    
    if results and results["ids"] and len(results["ids"][0]) > 0:
        for i in range(len(results["ids"][0])):
            context_docs.append(results["documents"][0][i])
            doc_id = results["ids"][0][i]
            author = results["metadatas"][0][i].get("author", "unknown")
            sub = results["metadatas"][0][i].get("subreddit", "unknown")
            sources.append({"id": doc_id, "author": author, "subreddit": sub})
            
    # 2. Construct Prompt with context
    system_prompt = """You are NarrativeScope, an investigative social media dashboard assistant. 
    You are analyzing narratives. Use the provided context extracted from social media posts to answer the user's question. 
    Be objective and cite your sources. If you don't know the answer based on the context, say you don't know and suggest what the user could search for instead."""
    
    context_text = "\n\n---\n\n".join(context_docs)
    
    # 3. Build history for Gemini
    gemini_history = []
    for msg in req.history:
        # Convert user -> user, assistant -> model
        gemini_history.append({
            "role": "model" if msg.role in ["assistant", "system"] else "user",
            "parts": [msg.content]
        })
        
    try:
        model = genai.GenerativeModel("gemini-3-flash-preview", system_instruction=system_prompt)
        chat = model.start_chat(history=gemini_history)
        
        prompt_with_context = f"CONTEXT:\n{context_text}\n\nUSER QUESTION: {req.message}"
        response = chat.send_message(prompt_with_context)
        
        # 4. Generate 3 suggested queries
        # (For simplicity we just append them to the end, or we call the model a second time. Let's do a second quick call for structure)
        suggested_prompt = f"Based on the conversation and the context, generate exactly 3 short follow-up search queries as a JSON array of strings. Do not use Markdown formatting, just output the array."
        sg_res = model.generate_content(suggested_prompt)
        try:
            import json
            # try to parse the array
            raw_sg = sg_res.text.replace('```json', '').replace('```', '').strip()
            suggestions = json.loads(raw_sg)
        except:
            suggestions = ["What are other narratives?", "Who are the key actors?", "How has sentiment changed?"]
            
        return {
            "reply": response.text,
            "sources": sources[:5], # Send top 5 sources back for UI citation
            "suggested_queries": suggestions[:3]
        }
        
    except Exception as e:
        print("Chat API Error:", e)
        return JSONResponse(status_code=500, content={"error": str(e)})
