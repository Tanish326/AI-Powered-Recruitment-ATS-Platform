from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from app.models.model import PipelineStage, InterviewType

# --- Job Schemas ---
class JobBase(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[str] = []
    nice_to_have: List[str] = []
    min_experience: int = 0
    max_experience: int = 20
    status: str = "active"

class JobCreate(JobBase):
    pass

class JobOut(JobBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Candidate Schemas ---
class CandidateBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    years_experience: float = 0
    current_role: Optional[str] = None
    current_company: Optional[str] = None

class CandidateCreate(CandidateBase):
    job_id: Optional[int] = None
    resume_text: Optional[str] = None

class CandidateUpdate(BaseModel):
    stage: Optional[PipelineStage] = None
    notes: Optional[str] = None

class CandidateOut(CandidateBase):
    id: int
    skills: List[str] = []
    education: List[Any] = []
    work_history: List[Any] = []
    ai_score: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_strengths: List[str] = []
    ai_gaps: List[str] = []
    ai_recommendation: Optional[str] = None
    stage: PipelineStage
    job_id: Optional[int] = None
    resume_filename: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Interview Schemas ---
class InterviewCreate(BaseModel):
    candidate_id: int
    job_id: Optional[int] = None
    interview_type: InterviewType
    scheduled_at: datetime
    duration_minutes: int = 60
    interviewer_name: str
    interviewer_email: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    feedback: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class InterviewOut(InterviewCreate):
    id: int
    feedback: Optional[str] = None
    rating: Optional[float] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- AI Screening ---
class ScreeningRequest(BaseModel):
    candidate_id: int
    job_id: int

class SkillMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    required_skills: List[str]

class PipelineStats(BaseModel):
    applied: int
    screening: int
    interview: int
    offer: int
    rejected: int
    hired: int
    total: int
    avg_score: float