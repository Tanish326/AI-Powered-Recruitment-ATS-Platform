from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models import model
from app.schemas import schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.JobOut])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(model.Job).filter(model.Job.status == "active").all()


@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("/", response_model=schemas.JobOut)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = model.Job(**job.dict())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.put("/{job_id}", response_model=schemas.JobOut)
def update_job(job_id: int, job: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not db_job:
        raise HTTPException(404, "Job not found")
    for k, v in job.dict().items():
        setattr(db_job, k, v)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(model.Job).filter(model.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    job.status = "closed"
    db.commit()
    return {"ok": True}