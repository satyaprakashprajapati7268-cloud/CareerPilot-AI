from main import SessionLocal, JobDB, UserDB, CompanyDB

def test_mysql_connection():
    print("Testing MySQL connection via SQLAlchemy SessionLocal...")
    db = SessionLocal()
    try:
        jobs = db.query(JobDB).all()
        print(f"[SUCCESS] Successfully retrieved {len(jobs)} jobs from MySQL 'smarthire' database!")
        for j in jobs:
            comp = db.query(CompanyDB).filter(CompanyDB.id == j.company_id).first()
            comp_name = comp.name if comp else 'N/A'
            print(f"  - Job: '{j.title}' at {comp_name} ({j.location}) | Salary: {j.salary}")
        
        users = db.query(UserDB).all()
        print(f"[SUCCESS] Successfully retrieved {len(users)} users from MySQL database!")
        for u in users:
            print(f"  - User: {u.email} ({u.role}) | Tier: {u.subscription_tier}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_mysql_connection()
