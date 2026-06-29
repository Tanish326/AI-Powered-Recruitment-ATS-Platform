from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models import model
from app.schemas import schemas
from app.services.nlp_service import parse_resume, screen_candidate_against_job
import io

router = APIRouter()


def extract_text_from_upload(content: bytes, filename: str) -> str:
    """Safely extract text — handles PDF and plain text."""
    fname = (filename or "").lower()
    if fname.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            if text.strip():
                return text
        except Exception:
            pass
    try:
        return content.decode("utf-8", errors="ignore")
    except Exception:
        return ""


@router.get("/", response_model=List[schemas.CandidateOut])
def list_candidates(
    job_id: Optional[int] = None,
    stage: Optional[str] = None,
    min_score: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(model.Candidate)
    if job_id:
        q = q.filter(model.Candidate.job_id == job_id)
    if stage:
        q = q.filter(model.Candidate.stage == stage)
    if min_score is not None:
        q = q.filter(model.Candidate.ai_score >= min_score)
    return q.order_by(model.Candidate.ai_score.desc().nullslast()).offset(skip).limit(limit).all()


@router.get("/{candidate_id}", response_model=schemas.CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    return c


@router.post("/", response_model=schemas.CandidateOut)
def create_candidate(candidate: schemas.CandidateCreate, db: Session = Depends(get_db)):
    existing = db.query(model.Candidate).filter(model.Candidate.email == candidate.email).first()
    if existing:
        raise HTTPException(400, "Candidate with this email already exists")
    db_candidate = model.Candidate(**candidate.dict())
    if candidate.resume_text:
        parsed = parse_resume(candidate.resume_text)
        db_candidate.skills = parsed["skills"]
        db_candidate.years_experience = parsed["years_experience"]
        db_candidate.education = parsed["education"]
        db_candidate.work_history = parsed["work_history"]
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


@router.post("/upload-resume", response_model=schemas.CandidateOut)
async def upload_resume(
    name: str = Form(...),
    email: str = Form(...),
    job_id: Optional[int] = Form(None),
    resume: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # --- Extract resume text safely ---
    resume_text = ""
    resume_filename = None
    if resume and resume.filename:
        content = await resume.read()
        resume_text = extract_text_from_upload(content, resume.filename)
        resume_filename = resume.filename

    # --- Upsert: UPDATE if email exists, INSERT if new ---
    existing = db.query(model.Candidate).filter(model.Candidate.email == email).first()
    if existing:
        # Update instead of throwing 400
        existing.name = name
        if job_id:
            existing.job_id = job_id
        if resume_text:
            existing.resume_text = resume_text
            existing.resume_filename = resume_filename
            parsed = parse_resume(resume_text)
            existing.skills = parsed["skills"]
            existing.years_experience = parsed["years_experience"]
            existing.education = parsed["education"]
            existing.work_history = parsed["work_history"]
        db.commit()
        db.refresh(existing)
        candidate = existing
    else:
        parsed = parse_resume(resume_text) if resume_text else {
            "skills": [], "years_experience": 0, "education": [], "work_history": []
        }
        candidate = model.Candidate(
            name=name,
            email=email,
            job_id=job_id,
            resume_text=resume_text or None,
            resume_filename=resume_filename,
            skills=parsed["skills"],
            years_experience=parsed["years_experience"],
            education=parsed["education"],
            work_history=parsed["work_history"],
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # --- Run AI screening if job assigned ---
    if candidate.job_id and (resume_text or candidate.resume_text):
        job = db.query(model.Job).filter(model.Job.id == candidate.job_id).first()
        if job:
            text = resume_text or candidate.resume_text or ""
            result = screen_candidate_against_job(
                name, text,
                job.required_skills or [],
                job.nice_to_have or [],
                job.min_experience,
                job.max_experience
            )
            candidate.ai_score = result["ai_score"]
            candidate.ai_summary = result["ai_summary"]
            candidate.ai_recommendation = result["ai_recommendation"]
            candidate.ai_strengths = result["ai_strengths"]
            candidate.ai_gaps = result["ai_gaps"]
            if candidate.stage == model.PipelineStage.applied:
                candidate.stage = model.PipelineStage.screening
            db.commit()
            db.refresh(candidate)

    return candidate


@router.patch("/{candidate_id}", response_model=schemas.CandidateOut)
def update_candidate(candidate_id: int, update: schemas.CandidateUpdate, db: Session = Depends(get_db)):
    c = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    for k, v in update.dict(exclude_none=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    db.delete(c)
    db.commit()
    return {"ok": True}