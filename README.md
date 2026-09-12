# 🚀 CareerPilot AI — Autonomous AI Career & Hiring Ecosystem

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tests: 15/15 PASS](https://img.shields.io/badge/QA%20Tests-15%2F15%20PASS%20(100%25)-10b981)](verify-matching.js)

**CareerPilot AI** is an enterprise-grade, autonomous single-page AI career platform and recruitment ecosystem. It integrates client-side multi-page PDF/DOCX resume text extraction, algorithmic ATS health scoring, multi-turn AI mock interview simulation with STAR methodology grading, Google OAuth 2.0 authentication, bidirectional Kanban/Grid application pipeline, and an interactive payment gateway.

---

## 🌐 Live Access & Repositories

* **GitHub Repository**: [https://github.com/satyaprakashprajapati7268-cloud/CareerPilot-AI](https://github.com/satyaprakashprajapati7268-cloud/CareerPilot-AI)
* **Local Development**: `http://localhost:5173/` (or network `http://192.168.250.23:5173/`)

---

## ✨ Key Platform Features

### 1. 🔑 Google OAuth 2.0 & Multi-Provider Authentication
* Official **Google Identity Services (GIS)** One-Tap integration and Device Account Chooser popup.
* Full verification pipeline: Google ID Token (JWT) decode ➔ User Database query ➔ Auto-registration or login ➔ Session JWT issuance (`careerpilot_jwt_session`).
* Passwordless **WhatsApp Mobile Number + OTP** authentication and standard email/password authentication.

### 2. 📄 Real PDF & DOCX Resume Data Extractor
* Client-side parsing using **`pdf.js`** (PDF text stream reader) and **`jszip`** (DOCX XML parser).
* Extracts genuine candidate full name, email, phone number, years of experience, target cities, and over 200+ technical skills.

### 3. 🤖 Executive AI Mock Interview Simulator & STAR Scoring
* Multi-turn simulated technical and behavioral interview rounds for Frontend, Backend, Product Management, and Data Science roles.
* Adaptive question generation with instant evaluation, feedback rating, and STAR methodology metrics.
* Interactive prompt chips (`⚡ Introduction`, `🎯 Performance`, `💡 STAR Challenge`, `🏗️ System Design`).

### 4. 📄 ATS Resume Health Center & 5/5 Audit Checklist
* Dual-tone gradient scorecard with overall ATS Health Grade (**100% Optimized**).
* Animated category progress bars: *Skills Density (94%)*, *Experience Relevance (88%)*, *Education Match (90%)*, *Profile Strength (100%)*.
* 2-column verified checklist and AI strategic optimization recommendations.

### 5. 📊 Interactive My Applications Pipeline (Kanban & Grid View)
* Dynamic status filter pills: `All Applications`, `Applied`, `Screening`, `Interviewing`, `Offers`, `Rejected`.
* Real-time live count badges on every filter pill with instant synchronized column/card filtering.

### 6. 💳 Transparent Indian Rupee Pricing & Golden Circle Pro Avatar
* **Free Basic Plan (₹0 / mo)**: 5 manual applications/day, standard matching.
* **Job Seeker Pro 👑 (₹199 / mo)**:
  * 👑 **Golden Circle Profile Avatar** with pulsating gold glow (`.premium-gold`) & floating crown.
  * 👑 **`PRO 👑` Badge** next to user's name across the portal.
  * 🚀 **Unlimited Autonomous Auto-Apply** to matching jobs.
  * 🎙️ **Unlimited AI Mock Interviews & STAR Scoring**.
  * 🎯 **14-Day Career Roadmap & Daily Milestone Planner**.
* **Enterprise Recruiter (₹499 / mo)**:
  * 🏢 Unlimited job vacancy postings.
  * 🧠 Autonomous AI candidate screening dossiers.
  * 📅 Direct candidate chat & live calendar scheduling.
  * 📊 Complete candidate database access & export.

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v16 or higher) installed on your system.

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/satyaprakashprajapati7268-cloud/CareerPilot-AI.git

# 2. Navigate to project directory
cd CareerPilot-AI

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev

# 5. Open browser at http://localhost:5173/
```

### Production Build

```bash
npm run build
```

---

## 🔍 Algorithmic QA Test Suite

CareerPilot includes an automated 15-stage algorithmic test suite verifying matching accuracy, DAG failover, and ATS parsing:

```bash
node verify-matching.js
```

**Output**:
```text
--------------------------------------------------
RUNNING AI MATCHING ALGORITHM VERIFICATION TESTS
--------------------------------------------------
Test 1 (Perfect Match): Overall: 100% (Expected: 100%)
Test 2 (Partial Match): Overall: 70%
Test 3 (Resume Parser Simulation): Passed
Test 4 (ATS Resume Evaluation): 100/100
Test 5 (Analytics Generation): Passed
Test 6 (STAR Interview Evaluation): 96%
Test 7 (Career Goal Understanding Agent): Passed
Test 8 (Resume Analyzer Agent): Passed
Test 9 (Skill Matcher & Decision Agent): 93% Match
Test 10 (Skill Gap Analyzer): Passed
Test 11 (14-Day Learning Planner): 9 Milestones
Test 12 (Autonomous Adaptation & API Failover): Passed
Test 13 (Dynamic Re-Evaluation Engine): Passed
Test 14 (AI Interviewer Q&A Generation): Passed
Test 15 (AI Interviewer Evaluation & Dossier): Passed
--------------------------------------------------
✅ ALL 15 VERIFICATION TESTS PASSED WITH 100% SUCCESS!
--------------------------------------------------
```

---

## 📁 Repository Structure

```text
├── index.html            # Main Single-Page Application Interface & Modals
├── app.js                # Core SPA Controller, State, Event Listeners & Auth
├── ai-engine.js          # AI Matching Math, ATS Parser & Interview Logic
├── styles.css            # Executive UI Styles, Animations & Dark/Light Themes
├── data-mock.js          # Seed Data for Jobs, Candidates & Applications
├── verify-matching.js    # 15-Stage Algorithmic Verification Test Suite
├── package.json          # Dependencies & Scripts (Vite build)
├── vercel.json           # Vercel Production Deployment Configuration
└── dist/                 # Production Build Assets
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
