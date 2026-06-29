from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models import model
from app.schemas import schemas
from typing import Optional

router = APIRouter()


@router.get("/stats")
def pipeline_stats(job_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(model.Candidate)
    if job_id:
        q = q.filter(model.Candidate.job_id == job_id)
    all_candidates = q.all()
    stages = {s.value: 0 for s in model.PipelineStage}
    scores = []
    for c in all_candidates:
        stages[c.stage.value] += 1
        if c.ai_score:
            scores.append(c.ai_score)
    return {
        **stages,
        "total": len(all_candidates),
        "avg_score": round(sum(scores) / max(len(scores), 1), 1),
        "screened": sum(1 for c in all_candidates if c.ai_score is not None),
    }


@router.patch("/{candidate_id}/move")
def move_candidate(candidate_id: int, stage: str, db: Session = Depends(get_db)):
    c = db.query(model.Candidate).filter(model.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(404, "Candidate not found")
    try:
        c.stage = model.PipelineStage(stage)
    except ValueError:
        raise HTTPException(400, f"Invalid stage: {stage}")
    db.commit()
    db.refresh(c)
    return {"id": c.id, "stage": c.stage}


@router.get("/board")
def pipeline_board(job_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(model.Candidate)
    if job_id:
        q = q.filter(model.Candidate.job_id == job_id)
    candidates = q.order_by(model.Candidate.ai_score.desc().nullslast()).all()

    board = {s.value: [] for s in model.PipelineStage}
    for c in candidates:
        board[c.stage.value].append({
            "id": c.id,
            "name": c.name,
            "current_role": c.current_role,
            "years_experience": c.years_experience,
            "ai_score": c.ai_score,
            "skills": c.skills[:5] if c.skills else [],
            "stage": c.stage.value,
        })
    return board