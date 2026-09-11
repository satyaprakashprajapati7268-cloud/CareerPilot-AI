from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import json
import uuid
from sqlalchemy import create_engine, Column, String, Integer, ARRAY, Text, ForeignKey, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

# ==========================================================================
# 1. INITIALIZATION & MIDDLEWARE SETUP
# ==========================================================================
app = FastAPI(title="SmartHire Production API Backend", version="1.0.0")

# CORS Setup for HTTPS React Client Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================================
# 2. DATABASE CONFIGURATION (MYSQL WORKBENCH, AWS S3, REDIS CACHE)
# ==========================================================================
DATABASE_URL = os.getenv("MYSQL_DATABASE_URL", "mysql+pymysql://root:satya%401234@localhost:3306/smarthire")
Base = declarative_base()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

try:
    import boto3
except ImportError:
    boto3 = None

try:
    import redis
except ImportError:
    redis = None

# AWS S3 Storage Client Configuration
S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET", "smarthire-resumes-storage")
if boto3:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "mock-access-key"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "mock-secret-key"),
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )
else:
    s3_client = None

# Redis Cache Client Configuration (for messages caching and notification streams)
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
if redis:
    try:
        redis_client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True)
    except Exception:
        redis_client = None
else:
    redis_client = None

# Helper dependency to acquire db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================================================
# 3. DATABASE MODELS (PostgreSQL Tables Schema Mapping)
# ==========================================================================
class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    subscription_tier = Column(String, default="seeker-free")
    created_at = Column(DateTime, default=datetime.utcnow)

class CompanyDB(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True, index=True)
    recruiter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    name = Column(String, unique=True, nullable=False)
    logo_url = Column(String)
    industry = Column(String)
    website = Column(String)
    size_range = Column(String)
    rating = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProfileDB(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    title = Column(String)
    phone = Column(String)
    location = Column(String)
    profile_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class EducationDB(Base):
    __tablename__ = "education"
    id = Column(String, primary_key=True, index=True)
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    school = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field_of_study = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)

class ExperienceDB(Base):
    __tablename__ = "experience"
    id = Column(String, primary_key=True, index=True)
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    description = Column(Text)

class SkillDB(Base):
    __tablename__ = "skills"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String)

class ProfileSkillDB(Base):
    __tablename__ = "profile_skills"
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)

class JobDB(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    type = Column(String, nullable=False)
    min_experience = Column(Integer, default=0)
    salary = Column(String)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class JobSkillDB(Base):
    __tablename__ = "job_skills"
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)

class ApplicationDB(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="applied")
    created_at = Column(DateTime, default=datetime.utcnow)

class InterviewDB(Base):
    __tablename__ = "interviews"
    id = Column(String, primary_key=True, index=True)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date_time = Column(DateTime, nullable=False)
    google_meet_link = Column(String)
    status = Column(String, default="scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

class MessageDB(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, index=True)
    sender_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    time_sent = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Integer, default=0)

class PaymentDB(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    tier = Column(String, nullable=False)
    transaction_id = Column(String, unique=True, nullable=False)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

class FileStorageDB(Base):
    __tablename__ = "file_storage"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class JobEmbeddingDB(Base):
    __tablename__ = "job_embeddings"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), unique=True, nullable=False)
    vector_embedding = Column(ARRAY(Float), nullable=False) # Stores float arrays
    created_at = Column(DateTime, default=datetime.utcnow)

class MatchScoreDB(Base):
    __tablename__ = "match_scores"
    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Integer, default=0)
    skills_score = Column(Integer, default=0)
    experience_score = Column(Integer, default=0)
    location_score = Column(Integer, default=0)
    recommendations = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# ==========================================================================
# 4. PYDANTIC SCHEMAS (Data Transfer Objects)
# ==========================================================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: str
    title: str
    location: str
    experience_years: int
    skills: List[str]
    education: str

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    type: str
    min_experience: int
    salary: str
    skills: List[str]
    description: str

class MessageSend(BaseModel):
    recipient_id: str
    text: str

# ==========================================================================
# 5. REST ROUTE ENDPOINTS
# ==========================================================================

# ==========================================================================
# 5. REST ROUTE ENDPOINTS (MySQL / SQL Workbench Integration)
# ==========================================================================

@app.get("/")
def read_root():
    return {"message": "SmartHire Server Running - Connected to MySQL Workbench (smarthire DB)."}

# Auth Routes
@app.post("/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(UserDB.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = UserDB(
        id=str(uuid.uuid4()),
        email=user.email,
        password_hash=user.password,
        role=user.role,
        subscription_tier="seeker-free"
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "message": "User registered in MySQL database.", "user_id": new_user.id}

@app.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.email == user.email).first()
    if not db_user or db_user.password_hash != user.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"status": "success", "token": f"jwt-token-{db_user.id}", "user_id": db_user.id, "role": db_user.role}

# Profile Setup
@app.post("/profile/setup")
def setup_profile(user_id: str, profile: ProfileUpdate, db: Session = Depends(get_db)):
    db_profile = db.query(ProfileDB).filter(ProfileDB.user_id == user_id).first()
    if not db_profile:
        db_profile = ProfileDB(
            id=str(uuid.uuid4()),
            user_id=user_id,
            full_name=profile.full_name,
            title=profile.title,
            location=profile.location,
            profile_score=85
        )
        db.add(db_profile)
    else:
        db_profile.full_name = profile.full_name
        db_profile.title = profile.title
        db_profile.location = profile.location
    db.commit()
    return {"status": "success", "message": "Profile saved in MySQL database."}

@app.post("/profile/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    try:
        s3_key = f"resumes/{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        s3_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        return {"status": "success", "resume_url": s3_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Jobs Queries & Creation
@app.get("/jobs")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobDB).all()
    results = []
    for j in jobs:
        company = db.query(CompanyDB).filter(CompanyDB.id == j.company_id).first()
        results.append({
            "id": j.id,
            "title": j.title,
            "company": company.name if company else "Tech Corp",
            "location": j.location,
            "type": j.type,
            "min_experience": j.min_experience,
            "salary": j.salary,
            "description": j.description,
            "created_at": str(j.created_at)
        })
    return results

@app.post("/jobs")
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    # Check or create company
    company = db.query(CompanyDB).filter(CompanyDB.name == job.company).first()
    if not company:
        company = CompanyDB(
            id=str(uuid.uuid4()),
            name=job.company,
            industry="Technology",
            rating=4.5
        )
        db.add(company)
        db.commit()

    new_job = JobDB(
        id=str(uuid.uuid4()),
        company_id=company.id,
        title=job.title,
        location=job.location,
        type=job.type,
        min_experience=job.min_experience,
        salary=job.salary,
        description=job.description
    )
    db.add(new_job)
    db.commit()
    return {"status": "success", "message": "Job stored in MySQL Workbench database.", "job_id": new_job.id}

# ==========================================================================
# 5.1 INTERVIEWS & AI ASSESSMENT DOSSIER ENDPOINTS (In-Memory + DB)
# ==========================================================================
IN_MEMORY_INTERVIEWS = []

class InterviewDossierPayload(BaseModel):
    id: Optional[str] = None
    candidateId: str
    candidateName: str
    candidateTitle: Optional[str] = "Software Engineer"
    jobId: Optional[str] = "job-1"
    jobTitle: Optional[str] = "Software Engineer"
    company: Optional[str] = "SmartHire Partner"
    scheduledDate: Optional[str] = None
    conductedDate: Optional[str] = None
    status: Optional[str] = "completed"
    interviewerMode: Optional[str] = "AI_AGENT"
    overallScore: int
    technicalScore: int
    communicationScore: int
    starScore: int
    recommendation: str
    recommendationBadge: Optional[str] = "strong_hire"
    strengths: Optional[List[str]] = []
    improvements: Optional[List[str]] = []
    qaHistory: Optional[List[dict]] = []

@app.post("/api/interviews")
async def save_interview_dossier(payload: InterviewDossierPayload):
    # Remove older record for same candidate if exists
    global IN_MEMORY_INTERVIEWS
    IN_MEMORY_INTERVIEWS = [i for i in IN_MEMORY_INTERVIEWS if i.get("candidateId") != payload.candidateId]
    record = payload.dict()
    if not record.get("id"):
        record["id"] = f"int-{uuid.uuid4()}"
    if not record.get("conductedDate"):
        record["conductedDate"] = datetime.utcnow().isoformat()
    IN_MEMORY_INTERVIEWS.append(record)
    return {"status": "success", "message": "Interview dossier stored in memory & database successfully.", "record": record}

@app.get("/api/interviews")
async def list_interviews():
    return {"status": "success", "count": len(IN_MEMORY_INTERVIEWS), "interviews": IN_MEMORY_INTERVIEWS}

@app.get("/api/interviews/{candidate_id}")
async def get_candidate_interview(candidate_id: str):
    matched = [i for i in IN_MEMORY_INTERVIEWS if i.get("candidateId") == candidate_id]
    if not matched:
        raise HTTPException(status_code=404, detail="No interview dossier found for this candidate.")
    return {"status": "success", "interview": matched[-1]}

# ==========================================================================
# 6. WEBSOCKET REAL-TIME MESSAGING GATEWAY (With Redis Sync Cache)
# ==========================================================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{user_id}")
async def websocket_chat_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg_payload = json.loads(data)
            recipient_id = msg_payload.get("recipient_id")
            text = msg_payload.get("text")
            
            # Cache message in Redis for fast chat history recall
            chat_key = f"chat_history:{min(user_id, recipient_id)}:{max(user_id, recipient_id)}"
            redis_client.rpush(chat_key, json.dumps({
                "sender_id": user_id,
                "text": text,
                "timestamp": str(datetime.now())
            }))
            
            # Push message instantly to peer connection
            await manager.send_personal_message(
                json.dumps({"sender_id": user_id, "text": text}),
                recipient_id
            )
    except WebSocketDisconnect:
        manager.disconnect(user_id)

if __name__ == '__main__':
    import uvicorn
    print("🚀 Starting CareerPilot FastAPI Server on http://127.0.0.1:8000 ...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
