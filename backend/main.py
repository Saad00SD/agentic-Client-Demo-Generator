import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("LANGSMITH_PROJECT", "demo-generator-v3")

from backend.observability import LangSmithMiddleware, flush, status as tracing_status

from backend.api.routes import router as api_router
from backend.api.conversations import router as conversation_router

@asynccontextmanager
async def lifespan(app):
    try:
        yield
    finally:
        await run_in_threadpool(flush)


app = FastAPI(
    title="AI-Powered Client Demo Generator API",
    description="Backend API for orchestrating client demo generation using LangGraph and Master Template Engine.",
    version="3.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-LangSmith-Trace-Id"],
)
app.add_middleware(LangSmithMiddleware)

app.include_router(api_router)
app.include_router(conversation_router)


@app.get("/api/observability/status")
def observability_status():
    return tracing_status()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "client-demo-generator-backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
