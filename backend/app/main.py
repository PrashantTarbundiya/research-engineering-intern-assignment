from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import search, analytics, network, chat
from dotenv import load_dotenv
import os

load_dotenv(override=True)

app = FastAPI(title="NarrativeScope API", description="Backend for tracking narratives")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://research-engineering-intern-assignm-livid.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from collections import defaultdict
import time
from fastapi import Request
from fastapi.responses import JSONResponse

# Store request timestamps per IP: { "ip_address": [timestamp1, timestamp2, ...] }
request_counts = defaultdict(list)
RATE_LIMIT_SECONDS = 60
MAX_REQUESTS = 30  # Max requests per minute

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Filter out timestamps older than the rate limit window
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < RATE_LIMIT_SECONDS]
    
    if len(request_counts[client_ip]) >= MAX_REQUESTS:
        return JSONResponse(
            status_code=429, 
            content={"error": "Rate limit exceeded. Please try again later."}
        )
    
    request_counts[client_ip].append(now)
    response = await call_next(request)
    return response

#routers
app.include_router(search.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(network.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to NarrativeScope API. Use /docs to view Swagger documentation."}
