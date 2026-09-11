import pymysql
import json
import uuid
from datetime import datetime

MYSQL_HOST = 'localhost'
MYSQL_PORT = 3306
MYSQL_USER = 'root'
MYSQL_PASS = 'satya@1234'
DB_NAME = 'smarthire'

def setup_database():
    print("Connecting to MySQL server...")
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASS,
        autocommit=True
    )
    cursor = conn.cursor()

    # 1. Create database
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
    cursor.execute(f"USE {DB_NAME};")
    print(f"Database '{DB_NAME}' created or selected.")

    # 2. Read and execute schema_mysql.sql
    with open('schema_mysql.sql', 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
    for stmt in statements:
        if stmt.upper().startswith("CREATE DATABASE") or stmt.upper().startswith("USE"):
            continue
        try:
            cursor.execute(stmt)
        except Exception as e:
            print(f"Note on statement execution: {e}")

    print("Schema execution complete.")

    # 3. Seed initial jobs, companies, users, and skills
    cursor.execute("SELECT COUNT(*) FROM jobs;")
    count = cursor.fetchone()[0]

    if count == 0:
        print("Seeding initial mock data into SQL Workbench / MySQL database...")
        
        # User recruiter
        recruiter_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, subscription_tier)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE role='recruiter';
        """, (recruiter_id, "recruiter@smarthire.ai", "hashed_pass_123", "recruiter", "recruiter-pro"))

        # Admin user
        admin_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, subscription_tier)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE role='recruiter';
        """, (admin_id, "satyaprakashprajapati459@gmail.com", "satya@1234", "recruiter", "recruiter-pro"))

        # Companies & Jobs
        jobs_data = [
            ("Frontend Engineer", "Google DeepMind", "London, UK", "hybrid", 3, "$110,000 - $140,000", "We are looking for a Frontend Engineer to construct advanced, responsive web applications for AI agent visualizations."),
            ("Backend Architect", "Stripe", "San Francisco, CA", "remote", 7, "$160,000 - $210,000", "Lead the design and development of our primary ledger and payment processing pipelines."),
            ("Data Scientist", "Netflix", "Los Gatos, CA", "on-site", 4, "$140,000 - $180,000", "Analyze viewer metrics and design personalization matching models."),
            ("Product Manager", "Vercel", "Remote", "remote", 5, "$130,000 - $165,000", "Own the developer tools experience. Help make hosting and front-end development frictionless."),
            ("Full Stack Developer", "Linear", "New York, NY", "hybrid", 2, "$95,000 - $120,000", "Help build the fastest project manager tool.")
        ]

        for title, company, loc, jtype, exp, sal, desc in jobs_data:
            company_id = str(uuid.uuid4())
            job_id = str(uuid.uuid4())

            cursor.execute("""
                INSERT INTO companies (id, recruiter_id, name, industry, rating)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE id=id;
            """, (company_id, recruiter_id, company, "Technology", 4.8))

            cursor.execute("SELECT id FROM companies WHERE name = %s;", (company,))
            existing_comp_id = cursor.fetchone()[0]

            cursor.execute("""
                INSERT INTO jobs (id, company_id, title, location, type, min_experience, salary, description)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (job_id, existing_comp_id, title, loc, jtype, exp, sal, desc))

        # Seeker User & Profile
        seeker_user_id = str(uuid.uuid4())
        seeker_profile_id = str(uuid.uuid4())

        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, subscription_tier)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE role='seeker';
        """, (seeker_user_id, "alex.carter@email.com", "hashed_seeker_pass", "seeker", "seeker-free"))

        cursor.execute("""
            INSERT INTO profiles (id, user_id, full_name, title, location, profile_score)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE full_name='Alex Carter';
        """, (seeker_profile_id, seeker_user_id, "Alex Carter", "Frontend Engineer", "Remote", 92))

        print("Data seeding completed successfully!")

    # Verify tables and rows
    cursor.execute("SHOW TABLES;")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"\n[SUMMARY] Active Tables in 'smarthire' MySQL database ({len(tables)} tables):")
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM `{t}`;")
        row_count = cursor.fetchone()[0]
        print(f"  - {t}: {row_count} rows")

    conn.close()

if __name__ == "__main__":
    setup_database()
