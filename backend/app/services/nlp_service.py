import re
import json
from typing import List, Dict, Tuple, Optional
import math

# Core skill taxonomy
SKILL_TAXONOMY = {
    "frontend": ["react", "vue", "angular", "nextjs", "typescript", "javascript", "html", "css",
                 "tailwind", "redux", "graphql", "webpack", "vite", "svelte"],
    "backend": ["python", "fastapi", "django", "flask", "nodejs", "express", "java", "spring",
                "go", "rust", "ruby", "rails", "php", "laravel", "dotnet"],
    "database": ["postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
                 "dynamodb", "cassandra", "supabase", "prisma", "sqlalchemy"],
    "devops": ["docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd", "jenkins",
               "github actions", "ansible", "linux", "nginx"],
    "data": ["pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "airflow",
             "dbt", "looker", "tableau", "powerbi", "sql", "r"],
    "design": ["figma", "sketch", "adobe xd", "invision", "principle", "framer", "zeplin",
               "maze", "hotjar", "design systems", "user research", "prototyping", "accessibility",
               "ux", "ui", "a/b testing", "usability testing"],
    "management": ["agile", "scrum", "kanban", "jira", "confluence", "product management",
                   "roadmapping", "stakeholder management", "okrs"],
    "nlp": ["nlp", "spacy", "nltk", "bert", "transformers", "llm", "openai", "langchain",
            "hugging face", "gpt", "embeddings"],
    "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android", "expo"],
}

ALL_SKILLS = {skill for skills in SKILL_TAXONOMY.values() for skill in skills}

EDUCATION_KEYWORDS = ["b.tech", "m.tech", "b.e", "m.e", "b.sc", "m.sc", "mba", "phd",
                      "bachelor", "master", "degree", "iit", "nit", "bits", "nid",
                      "university", "college", "institute"]

EXPERIENCE_PATTERNS = [
    r"(\d+\.?\d*)\s*(?:\+\s*)?(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)",
    r"experience\s*(?:of\s+)?(\d+\.?\d*)\s*(?:years?|yrs?)",
    r"worked\s+(?:for\s+)?(\d+\.?\d*)\s*(?:years?|yrs?)",
]

COMPANY_PATTERNS = [
    r"(?:at|@|with|for)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s*[-–|·]|\s*\(|\s*,|\s*\n)",
    r"([A-Z][a-zA-Z\s&]+?)\s*[-–]\s*(?:senior|junior|lead|principal|staff|engineer|designer|manager|developer)",
]


def extract_skills(text: str) -> List[str]:
    """Extract skills from resume text using keyword matching."""
    text_lower = text.lower()
    found_skills = []
    for skill in ALL_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)
    return list(set(found_skills))


def extract_experience_years(text: str) -> float:
    """Extract years of experience from resume text."""
    text_lower = text.lower()
    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text_lower)
        if matches:
            try:
                return float(matches[0])
            except ValueError:
                continue
    # Count date ranges as fallback
    date_pattern = r'(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current)'
    matches = re.findall(date_pattern, text_lower)
    if matches:
        total = sum(
            (2024 if end in ['present', 'current'] else int(end)) - int(start)
            for start, end in matches
        )
        return min(float(total), 25.0)
    return 0.0


def extract_education(text: str) -> List[Dict]:
    """Extract education entries from resume."""
    education = []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        for keyword in EDUCATION_KEYWORDS:
            if keyword in line_lower and len(line.strip()) > 5:
                education.append({
                    "raw": line.strip(),
                    "level": _classify_education(line_lower)
                })
                break
    return education[:5]


def _classify_education(line: str) -> str:
    if any(k in line for k in ["phd", "doctorate"]):
        return "PhD"
    if any(k in line for k in ["m.tech", "m.e", "master", "mba", "m.sc"]):
        return "Postgraduate"
    if any(k in line for k in ["b.tech", "b.e", "bachelor", "b.sc"]):
        return "Graduate"
    return "Other"


def extract_companies(text: str) -> List[str]:
    """Extract company names from resume."""
    companies = []
    known_companies = [
        "google", "amazon", "microsoft", "meta", "apple", "netflix", "uber", "airbnb",
        "flipkart", "swiggy", "zomato", "paytm", "razorpay", "meesho", "ola", "byju",
        "infosys", "wipro", "tcs", "hcl", "accenture", "deloitte", "pwc", "ibm",
    ]
    text_lower = text.lower()
    for company in known_companies:
        if company in text_lower:
            companies.append(company.title())
    return list(set(companies))[:5]


def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Compute cosine similarity between two skill vectors."""
    keys = set(vec1.keys()) | set(vec2.keys())
    if not keys:
        return 0.0
    dot = sum(vec1.get(k, 0) * vec2.get(k, 0) for k in keys)
    mag1 = math.sqrt(sum(v**2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v**2 for v in vec2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)


def build_skill_vector(skills: List[str], weights: Optional[Dict[str, float]] = None) -> Dict[str, float]:
    """Convert skill list to weighted vector."""
    vector = {}
    for skill in skills:
        w = weights.get(skill, 1.0) if weights else 1.0
        vector[skill] = w
    return vector


def compute_match_score(
    candidate_skills: List[str],
    required_skills: List[str],
    nice_to_have: List[str],
    years_experience: float,
    min_experience: int,
    max_experience: int
) -> Tuple[float, Dict[str, float]]:
    """Compute an AI match score and breakdown."""
    req_weights = {s: 2.0 for s in required_skills}
    nice_weights = {s: 1.0 for s in nice_to_have}

    jd_vector = build_skill_vector(required_skills + nice_to_have, {**req_weights, **nice_weights})
    cand_vector = build_skill_vector(candidate_skills, {**req_weights, **nice_weights})

    skill_score = cosine_similarity(cand_vector, jd_vector)

    req_matched = [s for s in required_skills if s in candidate_skills]
    req_coverage = len(req_matched) / max(len(required_skills), 1)

    exp_score = 1.0
    if years_experience < min_experience:
        exp_score = years_experience / max(min_experience, 1)
    elif years_experience > max_experience + 2:
        exp_score = max(0.6, 1 - (years_experience - max_experience) * 0.05)

    final_score = (
        skill_score * 0.40 +
        req_coverage * 0.40 +
        exp_score * 0.20
    )

    breakdown = {
        "skill_match": round(skill_score * 100, 1),
        "required_coverage": round(req_coverage * 100, 1),
        "experience_fit": round(exp_score * 100, 1),
        "overall": round(final_score * 100, 1),
    }
    return round(final_score * 100, 1), breakdown


def identify_gaps(candidate_skills: List[str], required_skills: List[str]) -> List[str]:
    """Find required skills the candidate is missing."""
    return [s for s in required_skills if s not in candidate_skills]


def identify_strengths(candidate_skills: List[str], required_skills: List[str], nice_to_have: List[str]) -> List[str]:
    """Find candidate's standout skills."""
    matched_req = [s for s in required_skills if s in candidate_skills]
    matched_nice = [s for s in nice_to_have if s in candidate_skills]
    return (matched_req + matched_nice)[:6]


def generate_ai_summary(
    name: str,
    score: float,
    skills: List[str],
    years_exp: float,
    strengths: List[str],
    gaps: List[str],
    companies: List[str],
    education: List[Dict],
) -> Tuple[str, str]:
    """Generate a human-readable AI screening summary and recommendation."""

    level = "strong" if score >= 80 else "moderate" if score >= 60 else "weak"
    rec = "advance" if score >= 75 else "review" if score >= 55 else "decline"

    edu_str = education[0]["raw"] if education else "details not extracted"
    company_str = ", ".join(companies[:3]) if companies else "previous employers"
    skill_str = ", ".join(skills[:8]) if skills else "not specified"
    strength_str = ", ".join(strengths[:4]) if strengths else "general skills"
    gap_str = ", ".join(gaps[:3]) if gaps else "none identified"

    summary = (
        f"{name} is a {level} match ({score:.0f}%) for this role. "
        f"With {years_exp:.0f} years of experience at {company_str}, they bring expertise in {skill_str}. "
        f"Key strengths include {strength_str}. "
        f"{'Areas to probe: ' + gap_str + '.' if gaps else 'No critical gaps identified.'} "
        f"Education: {edu_str}."
    )

    recommendation_map = {
        "advance": "Advance to next round",
        "review": "Manual review recommended",
        "decline": "Does not meet minimum requirements",
    }
    return summary, recommendation_map[rec]


def parse_resume(resume_text: str) -> Dict:
    """Full resume parsing pipeline."""
    skills = extract_skills(resume_text)
    years_exp = extract_experience_years(resume_text)
    education = extract_education(resume_text)
    companies = extract_companies(resume_text)

    return {
        "skills": skills,
        "years_experience": years_exp,
        "education": education,
        "companies": companies,
        "work_history": [{"company": c} for c in companies],
    }


def screen_candidate_against_job(
    candidate_name: str,
    resume_text: str,
    required_skills: List[str],
    nice_to_have: List[str],
    min_experience: int,
    max_experience: int,
) -> Dict:
    """Full AI screening pipeline for a candidate against a job."""
    parsed = parse_resume(resume_text)

    score, breakdown = compute_match_score(
        parsed["skills"],
        required_skills,
        nice_to_have,
        parsed["years_experience"],
        min_experience,
        max_experience,
    )

    strengths = identify_strengths(parsed["skills"], required_skills, nice_to_have)
    gaps = identify_gaps(parsed["skills"], required_skills)

    summary, recommendation = generate_ai_summary(
        candidate_name,
        score,
        parsed["skills"],
        parsed["years_experience"],
        strengths,
        gaps,
        parsed["companies"],
        parsed["education"],
    )

    return {
        "ai_score": score,
        "ai_summary": summary,
        "ai_recommendation": recommendation,
        "ai_strengths": strengths,
        "ai_gaps": gaps,
        "skill_breakdown": breakdown,
        **parsed,
    }