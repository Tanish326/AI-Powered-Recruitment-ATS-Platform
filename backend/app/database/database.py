from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ats_user:ats_password@localhost:5432/ats_db")
# Fallback to SQLite for local dev without Postgres
SQLITE_URL = "sqlite:///./ats_dev.db"

try:
    engine = create_engine(DATABASE_URL)
    engine.connect()
except Exception:
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()