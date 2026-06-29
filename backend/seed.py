"""Seed the database with realistic demo data."""
import sys
sys.path.insert(0, '.')
from app.database import SessionLocal, engine, Base
from app.models import Job, Candidate, Interview, PipelineStage, InterviewType
from app.services.nlp_service import screen_candidate_against_job
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Clear existing
db.query(Interview).delete()
db.query(Candidate).delete()
db.query(Job).delete()
db.commit()

# --- Jobs ---
jobs_data = [
    {
        "title": "Senior Product Designer",
        "department": "Design",
        "location": "Bangalore / Remote",
        "description": "Lead design for our core product. Own the design system and collaborate cross-functionally.",
        "required_skills": ["figma", "design systems", "user research", "prototyping", "accessibility"],
        "nice_to_have": ["framer", "sql", "a/b testing", "hotjar"],
        "min_experience": 5,
        "max_experience": 10,
    },
    {
        "title": "Senior Backend Engineer",
        "department": "Engineering",
        "location": "Bangalore / Hybrid",
        "description": "Build scalable APIs and data pipelines. Lead technical design for new features.",
        "required_skills": ["python", "fastapi", "postgresql", "docker", "redis"],
        "nice_to_have": ["kubernetes", "aws", "elasticsearch", "celery"],
        "min_experience": 4,
        "max_experience": 9,
    },
    {
        "title": "ML Engineer",
        "department": "AI",
        "location": "Remote",
        "description": "Build and deploy ML models for our recommendation engine.",
        "required_skills": ["python", "pytorch", "scikit-learn", "sql", "docker"],
        "nice_to_have": ["nlp", "transformers", "spark", "kubernetes"],
        "min_experience": 3,
        "max_experience": 8,
    },
]

jobs = []
for jd in jobs_data:
    job = Job(**jd)
    db.add(job)
    jobs.append(job)
db.commit()
for j in jobs:
    db.refresh(j)

# --- Candidates ---
candidates_data = [
    {
        "name": "Priya Krishnaswamy",
        "email": "priya.k@example.com",
        "phone": "+91 98765 43210",
        "location": "Bangalore, IN",
        "current_role": "Sr. Product Designer",
        "current_company": "Swiggy",
        "job_idx": 0,
        "stage": PipelineStage.interview,
        "resume_text": """Priya Krishnaswamy | Sr. Product Designer | 7 years experience
Swiggy | Senior Product Designer | 2020 - present
Led design system from 0 to 1, shipped 200+ components used across 12 product teams.
Figma, Principle, Maze, Zeplin, Hotjar expertise.
Ran 14 usability studies improving checkout conversion by 23%.
Flipkart | Product Designer | 2017 - 2020
Designed core commerce flows. A/B testing, user research, prototyping.
Accessibility compliance across all consumer apps.
Education: B.Des NID Ahmedabad 2017
Skills: Figma, Design Systems, User Research, Prototyping, Accessibility, A/B Testing, Hotjar, Framer, SQL
7 years experience in product design at scale.""",
    },
    {
        "name": "Arjun Mehta",
        "email": "arjun.m@example.com",
        "phone": "+91 87654 32109",
        "location": "Mumbai, IN",
        "current_role": "Product Designer",
        "current_company": "Zomato",
        "job_idx": 0,
        "stage": PipelineStage.screening,
        "resume_text": """Arjun Mehta | Product Designer | 5 years experience
Zomato | Product Designer | 2021 - present
End-to-end design for ordering experience. Heavy A/B testing, Figma, prototyping.
Framer, Principle for advanced prototypes.
User research and usability testing.
OYO Rooms | Junior Designer | 2019 - 2021
Visual and interaction design. Zeplin handoffs.
Education: B.Des MIT Institute of Design Pune 2019
Skills: Figma, Prototyping, A/B Testing, Framer, User Research
5 years product design experience.""",
    },
    {
        "name": "Neha Sharma",
        "email": "neha.s@example.com",
        "phone": "+91 76543 21098",
        "location": "Delhi, IN",
        "current_role": "UX Lead",
        "current_company": "Paytm",
        "job_idx": 0,
        "stage": PipelineStage.applied,
        "resume_text": """Neha Sharma | UX Lead | 9 years experience
Paytm | UX Lead | 2018 - present
Lead team of 8 designers. Design systems, accessibility, leadership.
WCAG 2.1 compliance across all products. Hotjar, Maze, SQL dashboards.
Figma, Sketch, InVision, design systems at enterprise scale.
MakeMyTrip | Senior UX Designer | 2015 - 2018
Research-led design. Usability testing, user research, prototyping.
Education: M.Des IDC IIT Bombay 2015
Skills: Figma, Design Systems, User Research, Prototyping, Accessibility, Leadership, SQL, Hotjar, Maze
9 years experience in UX and product design.""",
    },
    {
        "name": "Rahul Verma",
        "email": "rahul.v@example.com",
        "phone": "+91 65432 10987",
        "location": "Pune, IN",
        "current_role": "Visual Designer",
        "current_company": "BYJU'S",
        "job_idx": 0,
        "stage": PipelineStage.screening,
        "resume_text": """Rahul Verma | Visual Designer | 4 years experience
BYJU's | Visual Designer | 2021 - present
Motion graphics, illustration, Figma. Brand visual design.
Adobe After Effects, Lottie animations.
Freelance | Motion Designer | 2020 - 2021
Logo design, illustration, animation work.
Education: B.Des Srishti School of Design 2020
Skills: Figma, Illustration, Motion, Adobe After Effects
4 years visual design experience.""",
    },
    {
        "name": "Divya Nair",
        "email": "divya.n@example.com",
        "phone": "+91 54321 09876",
        "location": "Bangalore, IN",
        "current_role": "Principal Designer",
        "current_company": "Razorpay",
        "job_idx": 0,
        "stage": PipelineStage.offer,
        "resume_text": """Divya Nair | Principal Product Designer | 8 years experience
Razorpay | Principal Designer | 2019 - present
Built fintech design system from scratch. 150+ components, accessibility-first.
User research, A/B testing, Figma, Framer, SQL for data-informed design.
Hotjar, Maze, usability testing at scale. Led 5-person design team.
Freshworks | Senior Designer | 2016 - 2019
B2B SaaS product design. Complex data dashboards, user research, prototyping.
Education: B.Des NID Ahmedabad 2016
Skills: Figma, Design Systems, User Research, Prototyping, Accessibility, A/B Testing, SQL, Framer, Hotjar, Leadership
8 years product design experience.""",
    },
    {
        "name": "Aditya Kumar",
        "email": "aditya.k@example.com",
        "phone": "+91 98765 11111",
        "location": "Bangalore, IN",
        "current_role": "Backend Engineer",
        "current_company": "Flipkart",
        "job_idx": 1,
        "stage": PipelineStage.interview,
        "resume_text": """Aditya Kumar | Senior Backend Engineer | 6 years experience
Flipkart | Senior SDE | 2020 - present
Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes.
Microservices architecture, API design, AWS deployment.
Led migration of monolith to microservices.
Infosys | Software Engineer | 2018 - 2020
Java Spring, PostgreSQL, REST APIs.
Education: B.Tech NIT Trichy 2018
Skills: Python, FastAPI, PostgreSQL, Docker, Kubernetes, Redis, AWS, Elasticsearch
6 years backend engineering experience.""",
    },
    {
        "name": "Sneha Patel",
        "email": "sneha.p@example.com",
        "phone": "+91 87654 22222",
        "location": "Hyderabad, IN",
        "current_role": "ML Engineer",
        "current_company": "Meesho",
        "job_idx": 2,
        "stage": PipelineStage.screening,
        "resume_text": """Sneha Patel | ML Engineer | 4 years experience
Meesho | ML Engineer | 2021 - present
PyTorch, Scikit-learn, NLP, Transformers, BERT fine-tuning.
Recommendation engine, ranking models, SQL, Docker.
Hugging Face, LangChain, OpenAI API integrations.
Ola | Data Scientist | 2020 - 2021
Python, Pandas, NLP, scikit-learn.
Education: M.Tech IIT Delhi 2020
Skills: Python, PyTorch, Scikit-learn, NLP, Transformers, SQL, Docker, Spark
4 years ML engineering experience.""",
    },
]

candidates = []
for cd in candidates_data:
    job = jobs[cd.pop("job_idx")]
    stage = cd.pop("stage")
    resume_text = cd.pop("resume_text")
    candidate = Candidate(**cd, job_id=job.id, resume_text=resume_text)

    result = screen_candidate_against_job(
        candidate.name, resume_text,
        job.required_skills, job.nice_to_have,
        job.min_experience, job.max_experience
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
    candidate.stage = stage
    db.add(candidate)
    candidates.append(candidate)

db.commit()
for c in candidates:
    db.refresh(c)

# --- Interviews ---
now = datetime.utcnow()
interviews_data = [
    {
        "candidate_idx": 0,  # Priya
        "job_idx": 0,
        "interview_type": InterviewType.technical,
        "scheduled_at": now + timedelta(days=1, hours=5),
        "duration_minutes": 60,
        "interviewer_name": "Arun Singh",
        "interviewer_email": "arun.singh@company.com",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "status": "scheduled",
    },
    {
        "candidate_idx": 1,  # Arjun
        "job_idx": 0,
        "interview_type": InterviewType.portfolio,
        "scheduled_at": now + timedelta(days=1, hours=9),
        "duration_minutes": 60,
        "interviewer_name": "Preethi Rajan",
        "interviewer_email": "preethi.r@company.com",
        "meeting_link": "https://meet.google.com/klm-nopq-rst",
        "status": "scheduled",
    },
    {
        "candidate_idx": 2,  # Neha
        "job_idx": 0,
        "interview_type": InterviewType.system_design,
        "scheduled_at": now + timedelta(days=4, hours=4),
        "duration_minutes": 90,
        "interviewer_name": "Vikram Nair",
        "interviewer_email": "vikram.n@company.com",
        "meeting_link": "https://meet.google.com/uvw-xyz1-234",
        "status": "scheduled",
    },
    {
        "candidate_idx": 4,  # Divya
        "job_idx": 0,
        "interview_type": InterviewType.offer_discussion,
        "scheduled_at": now + timedelta(days=6, hours=8),
        "duration_minutes": 60,
        "interviewer_name": "Meera Iyer",
        "interviewer_email": "meera.i@company.com",
        "meeting_link": "https://meet.google.com/abc-offer-123",
        "status": "scheduled",
    },
]

for ivd in interviews_data:
    c_idx = ivd.pop("candidate_idx")
    j_idx = ivd.pop("job_idx")
    interview = Interview(
        candidate_id=candidates[c_idx].id,
        job_id=jobs[j_idx].id,
        **ivd
    )
    db.add(interview)

db.commit()
print("✅ Database seeded successfully!")
print(f"   Jobs: {len(jobs)}")
print(f"   Candidates: {len(candidates)}")
print(f"   Interviews: {len(interviews_data)}")
db.close()