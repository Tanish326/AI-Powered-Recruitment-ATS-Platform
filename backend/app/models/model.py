from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class PipelineStage(str, enum.Enum):
    applied = "applied"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    hired = "hired"

class InterviewType(str, enum.Enum):
    phone = "phone"
    technical = "technical"
    portfolio = "portfolio"
    system_design = "system_design"
    culture_fit = "culture_fit"
    offer_discussion = "offer_discussion"

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String)
    location = Column(String)
    description = Column(Text)
    required_skills = Column(JSON, default=[])
    nice_to_have = Column(JSON, default=[])
    min_experience = Column(Integer, default=0)
    max_experience = Column(Integer, default=20)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    candidates = relationship("Candidate", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    location = Column(String)
    years_experience = Column(Float, default=0)
    current_role = Column(String)
    current_company = Column(String)
    resume_text = Column(Text)
    resume_filename = Column(String)
    skills = Column(JSON, default=[])
    education = Column(JSON, default=[])
    work_history = Column(JSON, default=[])
    ai_score = Column(Float)
    ai_summary = Column(Text)
    ai_strengths = Column(JSON, default=[])
    ai_gaps = Column(JSON, default=[])
    ai_recommendation = Column(String)
    stage = Column(Enum(PipelineStage), default=PipelineStage.applied)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    job = relationship("Job", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    candidate = relationship("Candidate", back_populates="interviews")
    job_id = Column(Integer, ForeignKey("jobs.id"))
    interview_type = Column(Enum(InterviewType))
    scheduled_at = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer, default=60)
    interviewer_name = Column(String)
    interviewer_email = Column(String)
    meeting_link = Column(String)
    notes = Column(Text)
    feedback = Column(Text)
    rating = Column(Float)
    status = Column(String, default="scheduled")
    created_at = Column(DateTime(timezone=True), server_default=func.now())