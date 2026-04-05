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

#routers
app.include_router(search.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(network.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to NarrativeScope API. Use /docs to view Swagger documentation."}
