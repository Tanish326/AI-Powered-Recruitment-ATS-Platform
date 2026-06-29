from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models import model
from app.schemas.schemas import SkillMatchRequest
from app.services.nlp_service import screen_candidate_against_job, compute_match_score, extract_skills
import json
import asyncio

router = APIRouter()


@router.post("/screen/{candidate_id}")
def screen_candidate(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """Run AI screening for a candidate against a job."""
    candidate = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(404, "Candidate not found")
    job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if not candidate.resume_text:
        raise HTTPException(400, "No resume text available for this candidate")

    result = screen_candidate_against_job(
        candidate.name,
        candidate.resume_text,
        job.required_skills or [],
        job.nice_to_have or [],
        job.min_experience,
        job.max_experience,
    )

    candidate.ai_score = result["ai_score"]
    candidate.ai_summary = result["ai_summary"]
    candidate.ai_recommendation = result["ai_recommendation"]
    candidate.ai_strengths = result["ai_strengths"]
    candidate.ai_gaps = result["ai_gaps"]
    candidate.skills = result["skills"]
    candidate.years_experience = result["years_experience"]
    candidate.education = result["education"]
    candidate.work_history = result["work_history"]
    if candidate.stage == model.PipelineStage.applied:
        candidate.stage = model.PipelineStage.screening
    db.commit()

    return result


@router.post("/screen-all/{job_id}")
def screen_all_candidates(job_id: int, db: Session = Depends(get_db)):
    """Batch screen all unscreened candidates for a job."""
    job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    candidates = db.query(model.Candidate).filter(
        model.Candidate.job_id == job_id,
        model.Candidate.ai_score == None,
        model.Candidate.resume_text != None
    ).all()

    results = []
    for c in candidates:
        result = screen_candidate_against_job(
            c.name, c.resume_text,
            job.required_skills or [], job.nice_to_have or [],
            job.min_experience, job.max_experience,
        )
        c.ai_score = result["ai_score"]
        c.ai_summary = result["ai_summary"]
        c.ai_recommendation = result["ai_recommendation"]
        c.ai_strengths = result["ai_strengths"]
        c.ai_gaps = result["ai_gaps"]
        c.stage = model.PipelineStage.screening
        results.append({"id": c.id, "name": c.name, "score": result["ai_score"]})
    db.commit()
    return {"screened": len(results), "results": results}


@router.post("/skill-match")
def skill_match(request: SkillMatchRequest):
    """Match a resume against a JD without storing."""

    candidate_skills = extract_skills(request.resume_text)

    # 🔥 NORMALISATION (ADD HERE)
    required = [s.strip().lower() for s in request.required_skills]
    detected = [s.strip().lower() for s in candidate_skills]

    score, breakdown = compute_match_score(
        detected,
        required,
        [],
        0, 0, 20
    )

    matched = list(set(required) & set(detected))
    missing = list(set(required) - set(detected))

    return {
        "score": score,
        "breakdown": breakdown,
        "detected_skills": candidate_skills,
        "matched_skills": matched,
        "missing_skills": missing,
    }


@router.get("/stream/{candidate_id}")
async def stream_screening(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    """Stream AI screening analysis token by token."""
    candidate = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not candidate or not candidate.resume_text:
        raise HTTPException(404, "Candidate or resume not found")
    job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")

    result = screen_candidate_against_job(
        candidate.name, candidate.resume_text,
        job.required_skills or [], job.nice_to_have or [],
        job.min_experience, job.max_experience,
    )

    lines = [
        f"> Parsing resume: {candidate.resume_filename or 'resume.pdf'}",
        f"> Extracting entities with NLP...",
        f"> Education detected: {result['education'][0]['raw'] if result['education'] else 'N/A'}",
        f"> Experience: {result['years_experience']:.0f} years",
        f"> Skills found: {', '.join(result['skills'][:8])}",
        f"> Running skill match against JD...",
        f"> Required skills coverage: {len(result['ai_strengths'])}/{len(job.required_skills or [])}",
        f"> AI match score: {result['ai_score']:.0f}%",
        f"> Recommendation: {result['ai_recommendation']}",
        f"> Summary: {result['ai_summary'][:120]}...",
    ]

    async def generate():
        for line in lines:
            for char in line:
                yield f"data: {json.dumps({'char': char})}\n\n"
                await asyncio.sleep(0.02)
            yield f"data: {json.dumps({'char': '\\n'})}\n\n"
            await asyncio.sleep(0.1)
        yield f"data: {json.dumps({'done': True, 'result': result})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")