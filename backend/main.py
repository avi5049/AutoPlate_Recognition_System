"""
ANPR Backend - Main FastAPI Application
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from routes.detect import router as detect_router

app = FastAPI(
    title="ANPR System API",
    description="Automatic Number Plate Recognition REST API",
    version="1.0.0",
)

# CORS – allow React dev server and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static (for image preview URLs)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register Routers
app.include_router(detect_router, tags=["Detection"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "ANPR API is running 🚗"}
