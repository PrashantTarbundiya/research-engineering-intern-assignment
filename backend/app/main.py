from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import search, analytics, network, chat
from dotenv import load_dotenv
import os

# Load .env file from the root and override any shell-set variables
load_dotenv(override=True)

app = FastAPI(title="NarrativeScope API", description="Backend for tracking narratives")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(network.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to NarrativeScope API. Use /docs to view Swagger documentation."}
