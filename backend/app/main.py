from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai_screening, candidates
from app.routers import jobs
from app.routers import interviews
from app.routers import pipeline
from app.database.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HireAI ATS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates.router, prefix="/api/candidates", tags=["candidates"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(ai_screening.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
def root():
    return {"message": "HireAI ATS API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}