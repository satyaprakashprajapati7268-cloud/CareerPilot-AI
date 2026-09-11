/* ==========================================================================
   SmartHire AI Simulation Engine
   ========================================================================== */

const AIEngine = {
  
  /**
   * Parses resume text to accurately extract real user name, title, experience, location, education, and skills.
   */
  parseResume: function(text) {
    if (!text || typeof text !== 'string') return null;
    const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let fullName = "";
    let title = "";
    let experience = 0;
    let location = "";
    let education = "";
    let email = "";
    let phone = "";

    // 1. EXTRACT EMAIL & PHONE
    const emailMatch = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) email = emailMatch[0];

    const phoneMatch = cleanText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[\s-]?\d{10}|\b\d{10}\b/);
    if (phoneMatch) phone = phoneMatch[0];

    // 2. EXTRACT REAL FULL NAME
    // Check explicit name line first: "Name: John Doe"
    const explicitNameMatch = cleanText.match(/(?:Name|Candidate\s*Name|Full\s*Name)\s*[:\-]\s*([A-Za-z\s.'-]+)/i);
    if (explicitNameMatch && explicitNameMatch[1].trim().length > 2) {
      fullName = explicitNameMatch[1].trim();
    } else {
      // Scan top 6 lines for the real candidate name
      const ignoreWords = ["resume", "curriculum", "vitae", "cv", "profile", "contact", "email", "phone", "address", "portfolio", "github", "linkedin", "http", "www", "summary", "experience", "education", "skills", "projects"];
      for (let i = 0; i < Math.min(lines.length, 6); i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();
        
        // Skip lines that have ignore words, emails, urls, or special characters
        if (ignoreWords.some(w => lineLower.includes(w)) || line.includes('@') || line.includes('http') || line.includes('.com') || line.includes(':') || line.includes('|') || line.length > 45 || line.length < 2) {
          continue;
        }

        // Check if line looks like a person name (2 to 4 words, letters only)
        const nameCandidate = line.replace(/[^A-Za-z\s.'-]/g, '').trim();
        const words = nameCandidate.split(/\s+/);
        if (words.length >= 1 && words.length <= 4 && /^[A-Z][a-zA-Z.'-]*/.test(words[0])) {
          fullName = nameCandidate;
          break;
        }
      }
    }

    if (!fullName) {
      fullName = email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Candidate";
    }

    // 3. EXTRACT YEARS OF EXPERIENCE
    const expExplicitMatch = cleanText.match(/(?:experience|total\s*exp(?:erience)?)\s*[:\-]\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?|yr)?/i);
    if (expExplicitMatch) {
      experience = parseInt(expExplicitMatch[1]);
    } else {
      const expPhraseMatch = cleanText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?|yr)\s*(?:of)?\s*(?:work|professional|industry|relevant|software)?\s*(?:experience|exp)/i);
      if (expPhraseMatch) {
        experience = parseInt(expPhraseMatch[1]);
      } else {
        // Calculate experience from date ranges in experience section: e.g. 2020 - 2024 (4 years)
        const yearRanges = [...cleanText.matchAll(/\b(200\d|201\d|202\d)\s*[-–to]+\s*(201\d|202\d|present|current|now)\b/gi)];
        if (yearRanges.length > 0) {
          let maxSpan = 0;
          const currentYear = new Date().getFullYear();
          yearRanges.forEach(m => {
            const start = parseInt(m[1]);
            const endStr = m[2].toLowerCase();
            const end = (endStr.includes('present') || endStr.includes('current') || endStr.includes('now')) ? currentYear : parseInt(m[2]);
            const diff = end - start;
            if (diff > maxSpan && diff <= 35) maxSpan = diff;
          });
          if (maxSpan > 0) experience = maxSpan;
        }
      }
    }

    // Check for fresher indicators
    if (/fresher|entry[\s-]level|recent\s*graduate|final\s*year/i.test(cleanText) && experience === 0) {
      experience = 0;
    }

    // 4. EXTRACT LOCATION
    const explicitLocMatch = cleanText.match(/(?:Location|Address|City|Place)\s*[:\-]\s*([^\n,]+)/i);
    if (explicitLocMatch && explicitLocMatch[1].trim().length > 2) {
      location = explicitLocMatch[1].trim();
    } else {
      const locationsList = [
        "Bangalore", "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi", "Noida", "Gurgaon", "Gurugram", 
        "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Indore", "Bhopal", "Lucknow", "Chandigarh", "Kochi", 
        "Coimbatore", "Austin", "San Francisco", "New York", "Seattle", "Chicago", "Boston", "Los Angeles", 
        "London", "Berlin", "Munich", "Toronto", "Vancouver", "Singapore", "Dubai", "Sydney", "Remote", "India"
      ];
      for (const loc of locationsList) {
        const reg = new RegExp("\\b" + loc + "\\b", "i");
        if (cleanText.match(reg)) {
          location = (loc === "Bengaluru") ? "Bangalore" : (loc === "Gurugram") ? "Gurgaon" : loc;
          break;
        }
      }
    }
    if (!location) location = "Remote / India";

    // 5. EXTRACT EDUCATION
    const eduPatterns = [
      /B\.?Tech(?:nology)?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /B\.?E\.?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /M\.?Tech(?:nology)?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /M\.?S\.?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /B\.?C\.?A\.?/i,
      /M\.?C\.?A\.?/i,
      /B\.?S\.?c?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /M\.?S\.?c?(?:\s*in|\s*[-–]\s*)?\s*([A-Za-z\s&]+)?/i,
      /Bachelor(?:'s)?(?:\s*of\s*[A-Za-z\s]+)?/i,
      /Master(?:'s)?(?:\s*of\s*[A-Za-z\s]+)?/i,
      /Diploma(?:\s*in\s*[A-Za-z\s]+)?/i,
      /Ph\.?D\.?/i
    ];
    for (const pat of eduPatterns) {
      const match = cleanText.match(pat);
      if (match) {
        education = match[0].trim();
        break;
      }
    }
    if (!education) {
      if (/computer\s*science/i.test(cleanText)) education = "B.Tech in Computer Science";
      else if (/information\s*technology/i.test(cleanText)) education = "B.Tech in Information Technology";
      else education = "Bachelor's Degree";
    }

    // 6. COMPREHENSIVE SKILL EXTRACTION (200+ TECH SKILLS)
    const skillDictionary = [
      // Languages
      "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Golang", "Rust", 
      "PHP", "Ruby", "Swift", "Kotlin", "Dart", "R", "Scala", "Bash", "Shell",
      // Frontend & Web
      "React", "React.js", "React Native", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "AngularJS", 
      "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS", "Tailwind CSS", "Tailwind", "Bootstrap", 
      "Redux", "Zustand", "Webpack", "Vite", "jQuery",
      // Backend & Frameworks
      "Node.js", "Express", "Express.js", "Spring Boot", "Spring", "Hibernate", "Django", "Flask", 
      "FastAPI", "NestJS", ".NET Core", "ASP.NET", "Ruby on Rails", "Laravel", "GraphQL", "REST APIs", 
      "REST", "Microservices", "gRPC", "WebSockets",
      // Databases & Storage
      "SQL", "MySQL", "PostgreSQL", "Postgres", "MongoDB", "Redis", "Cassandra", "SQLite", 
      "Oracle", "MariaDB", "Elasticsearch", "DynamoDB", "Firebase", "Supabase", "Prisma", "Mongoose",
      // Cloud, DevOps & Infrastructure
      "AWS", "Amazon Web Services", "EC2", "S3", "Lambda", "GCP", "Google Cloud", "Azure", 
      "Docker", "Kubernetes", "K8s", "Terraform", "Ansible", "Jenkins", "CI/CD", "GitHub Actions", 
      "Linux", "Nginx",
      // AI / ML / Data Science
      "Machine Learning", "Deep Learning", "NLP", "Natural Language Processing", "Computer Vision", 
      "OpenCV", "LLM", "Generative AI", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-Learn", 
      "Data Science", "Power BI", "Tableau",
      // Tools & Practices
      "Git", "GitHub", "GitLab", "Postman", "JIRA", "Agile", "Scrum", "System Design", 
      "Data Structures", "Algorithms", "OOP", "OOPs", "Design Patterns", "Jest", "Unit Testing"
    ];

    const parsedSkills = [];
    for (const skill of skillDictionary) {
      // Precise regex boundary matching
      const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp("(?:^|[^a-zA-Z0-9_])" + esc + "(?:$|[^a-zA-Z0-9_])", "i");
      if (reg.test(cleanText)) {
        // Normalize aliases
        let canonical = skill;
        if (skill === "React.js") canonical = "React";
        if (skill === "Vue.js") canonical = "Vue";
        if (skill === "Express.js") canonical = "Express";
        if (skill === "Postgres") canonical = "PostgreSQL";
        if (skill === "Golang") canonical = "Go";
        if (skill === "Tailwind") canonical = "Tailwind CSS";
        if (skill === "HTML5") canonical = "HTML";
        if (skill === "CSS3") canonical = "CSS";
        if (skill === "Amazon Web Services") canonical = "AWS";
        if (skill === "Google Cloud") canonical = "GCP";
        if (skill === "K8s") canonical = "Kubernetes";

        if (!parsedSkills.includes(canonical)) {
          parsedSkills.push(canonical);
        }
      }
    }

    // Also extract comma-separated skills in explicit "Skills: a, b, c" blocks
    const skillsBlockMatch = cleanText.match(/(?:Technical\s*Skills|Skills|Key\s*Skills|Core\s*Competencies)\s*[:\-]\s*([^\n\r]+)/i);
    if (skillsBlockMatch) {
      const explicitList = skillsBlockMatch[1].split(/[,|•;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 30);
      explicitList.forEach(s => {
        if (!parsedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
          parsedSkills.push(s);
        }
      });
    }

    if (parsedSkills.length === 0) {
      parsedSkills.push("Java", "SQL", "React", "Git");
    }

    // 7. EXTRACT OR INFER TITLE / ROLE
    const titlesList = [
      "Senior Backend Architect", "Senior Backend Developer", "Java Developer", "Backend Developer", 
      "Backend Engineer", "Senior Frontend Engineer", "Frontend Developer", "Frontend Engineer", 
      "Full Stack Developer", "Full Stack Engineer", "Software Engineer", "Data Scientist", "Data Science Lead", 
      "DevOps Engineer", "Cloud Architect", "Machine Learning Engineer", "Product Manager", "Mobile App Developer",
      "QA Automation Engineer", "UI/UX Designer"
    ];
    for (const t of titlesList) {
      const reg = new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b", "i");
      if (cleanText.match(reg)) {
        title = t;
        break;
      }
    }
    
    // Fallback title inference based on extracted skills
    if (!title) {
      const skillsLower = parsedSkills.map(s => s.toLowerCase());
      const hasFrontend = skillsLower.some(s => ["react", "vue", "angular", "html", "css", "next.js", "tailwind css"].includes(s));
      const hasBackend = skillsLower.some(s => ["java", "spring boot", "node.js", "express", "python", "django", "postgresql", "sql", "mongodb"].includes(s));
      const hasML = skillsLower.some(s => ["machine learning", "deep learning", "pandas", "pytorch", "tensorflow", "data science"].includes(s));
      const hasCloud = skillsLower.some(s => ["aws", "docker", "kubernetes", "terraform", "ci/cd"].includes(s));

      if (hasFrontend && hasBackend) title = "Full Stack Engineer";
      else if (hasBackend) title = (experience >= 5) ? "Senior Backend Architect" : "Backend Developer";
      else if (hasFrontend) title = (experience >= 5) ? "Senior Frontend Engineer" : "Frontend Developer";
      else if (hasML) title = "Data Scientist";
      else if (hasCloud) title = "DevOps Engineer";
      else title = "Software Engineer";
    }

    return {
      fullName,
      title,
      experience,
      location,
      skills: parsedSkills,
      education,
      email,
      phone,
      resumeText: text
    };
  },

  /**
   * Computes matching scores between a Seeker Profile and a Job Mandate.
   */
  calculateMatchScore: function(profile, job) {
    if (!profile || !job) return { overall: 0, skills: 0, experience: 0, location: 0 };
    
    // 1. Skills Matching (50% weight)
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const profileSkills = profile.skills.map(s => s.toLowerCase());
    
    const matchedSkills = jobSkills.filter(s => profileSkills.includes(s));
    const skillsScore = jobSkills.length > 0 
      ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
      : 100;
      
    // 2. Experience Matching (35% weight)
    let experienceScore = 100;
    if (profile.experience < job.experience) {
      // Calculate fraction of experience
      experienceScore = Math.round((profile.experience / job.experience) * 100);
      // Soften penalty
      experienceScore = Math.max(experienceScore, 50);
    }
    
    // 3. Location Matching (15% weight)
    let locationScore = 0;
    const jobLoc = job.location.toLowerCase();
    const profLoc = profile.location.toLowerCase();
    
    if (job.type === 'remote' || profLoc.includes('remote') || jobLoc.includes('remote')) {
      locationScore = 100;
    } else if (jobLoc.includes(profLoc) || profLoc.includes(jobLoc)) {
      locationScore = 100;
    } else if (job.type === 'hybrid') {
      locationScore = 60; // Partial score for hybrid roles in another place
    } else {
      locationScore = 30; // Different city, onsite
    }
    
    // Calculate Weighted Score
    const overallScore = Math.round(
      (skillsScore * 0.50) + 
      (experienceScore * 0.35) + 
      (locationScore * 0.15)
    );
    
    return {
      overall: Math.min(overallScore, 100),
      skills: skillsScore,
      experience: experienceScore,
      location: locationScore
    };
  },
  
  /**
   * Dialog manager for simulated AI Mock Interviews.
   */
  mockInterviewQuestions: {
    "Frontend Developer": [
      "Explain the difference between useEffect with an empty dependency array and useEffect with no dependency array in React.",
      "How would you optimize the rendering performance of a large list component in React?",
      "What is CSS specificity, and how does the browser calculate it?"
    ],
    "Backend Architect": [
      "Describe how you would design a highly available, read-heavy API service that supports rate-limiting.",
      "What are the pros and cons of using relational SQL databases vs NoSQL databases like MongoDB?",
      "Explain the difference between optimistic and pessimistic locking in databases."
    ],
    "Product Manager": [
      "How do you prioritize features for a product roadmap when multiple stakeholders have conflicting demands?",
      "Describe a time you had to make a product decision with incomplete user analytics data. How did you proceed?",
      "How would you measure the success of a new 'Auto-Apply' recruitment feature?"
    ],
    "Data Scientist": [
      "What is the difference between supervised and unsupervised machine learning? Give examples of both.",
      "How do you handle missing or highly skewed features in a training dataset before modeling?",
      "Explain what overfitting is and three methods you can apply to prevent it."
    ]
  },
  
  getInterviewQuestion: function(role, index) {
    const questions = this.mockInterviewQuestions[role] || this.mockInterviewQuestions["Frontend Developer"];
    if (index >= questions.length) return null;
    return questions[index];
  },
  
  gradeUserAnswer: function(question, answer) {
    const wordCount = answer.trim().split(/\s+/).length;
    let score = 50; // Base score
    let feedback = "";
    
    if (wordCount < 10) {
      score = 45;
      feedback = "Your answer is quite brief. Try to explain the concepts in more technical depth with concrete examples.";
    } else {
      // Analyze content tags based on keywords
      const technicalKeywords = [
        "performance", "state", "render", "hook", "index", "database", "query", "user", "metric", 
        "analytics", "scale", "optimize", "cache", "model", "features", "data", "test", "ux"
      ];
      
      let keywordHits = 0;
      for (const kw of technicalKeywords) {
        if (answer.toLowerCase().includes(kw)) keywordHits++;
      }
      
      score = Math.min(65 + (keywordHits * 6) + Math.min(wordCount / 10, 10), 100);
      score = Math.round(score);
      
      if (score >= 85) {
        feedback = "Excellent! You structured your technical arguments clearly and hit relevant domain terminology. Very strong answer.";
      } else if (score >= 70) {
        feedback = "Good response. You cover the main points, but you could provide more examples of projects or system patterns where you implemented these solutions.";
      } else {
        feedback = "Solid effort. To improve, try incorporating more specific framework details or detailing the system-level trade-offs.";
      }
    }
    
    return { score, feedback };
  },

  /**
   * Evaluates resume data against ATS standards and returns health score and checklist.
   */
  evaluateResumeForATS: function(resumeData, targetRole = "Frontend Engineer") {
    if (!resumeData) return { score: 0, items: [], tips: [] };

    let score = 0;
    const items = [];
    const tips = [];

    // 1. Full Name check (15 pts)
    const hasName = resumeData.fullName && resumeData.fullName.trim().length > 2;
    items.push({ label: "Full Name Detected", passed: !!hasName });
    if (hasName) score += 15;
    else tips.push("Add a clear full name at the top of your resume.");

    // 2. Contact details check (15 pts)
    const text = (resumeData.summary || "") + " " + (resumeData.rawText || "") + " " + (resumeData.email || "") + " " + (resumeData.phone || "");
    const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text) || (resumeData.email && resumeData.email.length > 3);
    items.push({ label: "Contact Details (Email/Phone) parsed", passed: !!hasEmail });
    if (hasEmail) score += 15;
    else tips.push("Include a valid email address for recruiters to reach you.");

    // 3. Work Experience check (25 pts)
    const hasExp = (resumeData.experience && resumeData.experience > 0) || (resumeData.experienceText && resumeData.experienceText.length > 20);
    items.push({ label: "Work Experience records found", passed: !!hasExp });
    if (hasExp) score += 25;
    else tips.push("Detail your work history with bullet points and quantifiable achievements.");

    // 4. Skills tags check (25 pts)
    const hasSkills = Array.isArray(resumeData.skills) && resumeData.skills.length >= 3;
    items.push({ label: "Skills tags set (3+ core skills)", passed: !!hasSkills });
    if (hasSkills) score += 25;
    else tips.push("List at least 3-5 relevant technical or industry skills.");

    // 5. Sufficient detail / word count (20 pts)
    const fullCombinedText = (resumeData.summary || "") + " " + (resumeData.rawText || "") + " " + (resumeData.experienceText || "") + " " + (resumeData.email || "") + " " + (resumeData.phone || "") + " " + (Array.isArray(resumeData.skills) ? resumeData.skills.join(" ") : "");
    const wordCount = fullCombinedText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const hasDetail = wordCount >= 15;
    items.push({ label: "Sufficient word count / details (> 15 words)", passed: hasDetail });
    if (hasDetail) score += 20;
    else tips.push("Expand your profile summary and experience descriptions to improve search indexability.");


    return {
      score: Math.min(score, 100),
      items,
      tips
    };
  },

  /**
   * Generates dynamic recruitment funnel & match statistics for job seekers & recruiters.
   */
  generateAnalytics: function(jobsList = [], applicationsList = [], seekerProfile = null) {
    const totalApps = applicationsList.length;
    const funnel = {
      applied: applicationsList.filter(a => a.status === 'Applied' || a.status === 'Submitted').length,
      screening: applicationsList.filter(a => a.status === 'Screening' || a.status === 'Under Review').length,
      interview: applicationsList.filter(a => a.status === 'Interview' || a.status === 'Interview Scheduled').length,
      offer: applicationsList.filter(a => a.status === 'Offer Extended' || a.status === 'Hired').length
    };

    // Calculate score distribution across candidate applications or jobs
    let highMatchCount = 0;
    let medMatchCount = 0;
    let lowMatchCount = 0;
    let totalScoreSum = 0;
    let scoredCount = 0;

    const skillCounts = {};

    if (seekerProfile && jobsList.length > 0) {
      jobsList.forEach(job => {
        const scoreObj = this.calculateMatchScore(seekerProfile, job);
        const overall = scoreObj.overall;
        totalScoreSum += overall;
        scoredCount++;

        if (overall >= 80) highMatchCount++;
        else if (overall >= 50) medMatchCount++;
        else lowMatchCount++;

        // Tally required skills
        (job.skills || []).forEach(sk => {
          skillCounts[sk] = (skillCounts[sk] || 0) + 1;
        });
      });
    } else if (applicationsList.length > 0) {
      applicationsList.forEach(app => {
        const score = app.matchScore || app.score || 75;
        totalScoreSum += score;
        scoredCount++;

        if (score >= 80) highMatchCount++;
        else if (score >= 50) medMatchCount++;
        else lowMatchCount++;
      });
    }

    const avgScore = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;

    // Top skills array sorted by frequency
    const topSkills = Object.keys(skillCounts)
      .map(name => ({ name, count: skillCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Skill Gap Analysis for Seeker Profile
    let skillGaps = [];
    if (seekerProfile && seekerProfile.skills) {
      const userSkillsLower = seekerProfile.skills.map(s => s.toLowerCase());
      const missingDict = {};
      jobsList.forEach(job => {
        (job.skills || []).forEach(sk => {
          if (!userSkillsLower.includes(sk.toLowerCase())) {
            missingDict[sk] = (missingDict[sk] || 0) + 1;
          }
        });
      });
      skillGaps = Object.keys(missingDict)
        .map(sk => ({ skill: sk, inDemandCount: missingDict[sk] }))
        .sort((a, b) => b.inDemandCount - a.inDemandCount)
        .slice(0, 4);
    }

    return {
      totalApps,
      funnel,
      avgScore,
      scoreDistribution: {
        high: highMatchCount,
        medium: medMatchCount,
        low: lowMatchCount,
        total: scoredCount
      },
      topSkills,
      skillGaps
    };
  },

  /**
   * Evaluates mock interview response across multiple metrics including STAR method.
   */
  evaluateInterviewResponseDetailed: function(question, answer, role) {
    const base = this.gradeUserAnswer(question, answer);
    const wordCount = answer.trim().split(/\s+/).length;
    const lowerAns = answer.toLowerCase();

    // 1. Technical Depth (0-100)
    const techTerms = ["architecture", "state", "hook", "component", "performance", "api", "database", "scale", "query", "async", "cache", "security", "metric", "framework", "index"];
    let techHits = 0;
    techTerms.forEach(t => { if (lowerAns.includes(t)) techHits++; });
    const techDepthScore = Math.min(100, Math.round(40 + (techHits * 12) + (wordCount / 4)));

    // 2. Communication Clarity (0-100)
    const commScore = Math.min(100, Math.round(50 + Math.min(wordCount * 1.5, 45)));

    // 3. Keyword Alignment (0-100)
    const keywordScore = Math.min(100, Math.round(30 + (techHits * 15)));

    // 4. STAR Structure (Situation, Task, Action, Result)
    const starIndicators = {
      situation: ["when", "project", "client", "company", "time", "challenge", "scenario"],
      task: ["needed", "tasked", "goal", "objective", "required", "responsible"],
      action: ["built", "implemented", "designed", "created", "refactored", "led", "developed", "wrote", "analyzed"],
      result: ["resulted", "achieved", "improved", "increased", "reduced", "delivered", "outcome", "%", "percent"]
    };

    let starFoundCount = 0;
    const starBreakdown = {};
    Object.keys(starIndicators).forEach(part => {
      const found = starIndicators[part].some(kw => lowerAns.includes(kw));
      starBreakdown[part] = found;
      if (found) starFoundCount++;
    });

    const starScore = Math.min(100, Math.round((starFoundCount / 4) * 100));

    const overallScore = Math.round((techDepthScore * 0.35) + (commScore * 0.25) + (keywordScore * 0.20) + (starScore * 0.20));

    let starFeedback = "";
    if (starScore === 100) {
      starFeedback = "Outstanding STAR formatting! You clearly outlined Situation, Task, Action, and Result.";
    } else if (starScore >= 50) {
      starFeedback = "Good structure. To maximize your impact, ensure you quantify the final Business Result (e.g. 'reduced latency by 30%').";
    } else {
      starFeedback = "Consider using the STAR framework (Situation, Task, Action, Result) to make your answer more compelling.";
    }

    return {
      overallScore: Math.min(100, Math.max(overallScore, base.score)),
      techDepthScore,
      commScore,
      keywordScore,
      starScore,
      starBreakdown,
      feedback: base.feedback,
      starFeedback
    };
  }

};

/* ==========================================================================
   CAREERPILOT: LANGGRAPH-STYLE MULTI-AGENT ORCHESTRATOR
   ========================================================================== */
const CareerPilot = {

  /**
   * 1. CAREER GOAL UNDERSTANDING AGENT
   * Parses natural language career prompts into structured goal entities.
   */
  CareerGoalAgent: {
    understandGoal: function(promptOrObj) {
      if (typeof promptOrObj === 'object' && promptOrObj !== null) {
        return {
          role: promptOrObj.role || promptOrObj.targetRole || "Software Engineer",
          experience: promptOrObj.experienceLevel || (promptOrObj.experience === 0 ? "Fresher" : `${promptOrObj.experience} yrs`),
          experienceYears: typeof promptOrObj.experience === 'number' ? promptOrObj.experience : 0,
          location: promptOrObj.location || "India",
          targetDomain: promptOrObj.domain || "Web & Backend Applications",
          rawPrompt: promptOrObj.rawPrompt || "Looking for a Software Engineer role in India."
        };
      }

      const prompt = String(promptOrObj || "");
      const lower = prompt.toLowerCase();

      // Role extraction
      let role = "Software Engineer";
      if (lower.includes("java developer") || lower.includes("java backend")) role = "Java Developer";
      else if (lower.includes("frontend") || lower.includes("react developer")) role = "Frontend Engineer";
      else if (lower.includes("backend") || lower.includes("node")) role = "Backend Developer";
      else if (lower.includes("full stack") || lower.includes("fullstack")) role = "Full Stack Developer";
      else if (lower.includes("cloud") || lower.includes("devops") || lower.includes("docker")) role = "Cloud & Platform Engineer";
      else if (lower.includes("data scientist") || lower.includes("machine learning")) role = "Data Scientist";

      // Experience extraction
      let experience = "Fresher";
      let experienceYears = 0;
      if (lower.includes("fresher") || lower.includes("graduate") || lower.includes("entry level") || lower.includes("0 year") || lower.includes("intern")) {
        experience = "Fresher";
        experienceYears = 0;
      } else {
        const yrMatch = lower.match(/(\d+)\s*(?:years?|yrs?)/);
        if (yrMatch) {
          experienceYears = parseInt(yrMatch[1]);
          experience = `${experienceYears} Year${experienceYears > 1 ? 's' : ''}`;
        }
      }

      // Location extraction
      let location = "India";
      if (lower.includes("bangalore") || lower.includes("bengaluru")) location = "Bangalore, India";
      else if (lower.includes("hyderabad")) location = "Hyderabad, India";
      else if (lower.includes("pune")) location = "Pune, India";
      else if (lower.includes("gurgaon") || lower.includes("noida") || lower.includes("delhi")) location = "Gurgaon, India";
      else if (lower.includes("remote") || lower.includes("wfh")) location = "Remote";
      else if (lower.includes("us") || lower.includes("usa") || lower.includes("san francisco")) location = "San Francisco, CA";

      return {
        role,
        experience,
        experienceYears,
        location,
        targetDomain: "Enterprise & Web Services",
        rawPrompt: prompt
      };
    }
  },

  /**
   * 2. RESUME ANALYZER AGENT
   * Extracts skills, projects, education, experience, and certifications.
   */
  ResumeAnalyzerAgent: {
    analyzeResume: function(resumeInput) {
      if (typeof resumeInput === 'object' && resumeInput !== null && Array.isArray(resumeInput.skills)) {
        return {
          fullName: resumeInput.fullName || "Candidate",
          title: resumeInput.targetRole || resumeInput.title || "Software Engineer",
          experience: resumeInput.experienceLevel || (resumeInput.experience === 0 ? "Fresher" : `${resumeInput.experience} yrs`),
          experienceYears: typeof resumeInput.experience === 'number' ? resumeInput.experience : 0,
          location: resumeInput.location || "India",
          skills: resumeInput.skills.map(s => String(s).trim()),
          projects: resumeInput.projects || [
            { name: "E-commerce Web Platform", description: "Built with Java, React, SQL & MongoDB" },
            { name: "Finance Management App", description: "Personal expense tracking and analytics dashboard" }
          ],
          education: resumeInput.education || "B.Tech in Computer Science & Engineering",
          certifications: resumeInput.certifications || ["Java Core Certified", "Database Specialist"],
          rawText: resumeInput.resumeText || ""
        };
      }

      const text = typeof resumeInput === 'string' ? resumeInput : (resumeInput && resumeInput.resumeText) || "";
      const baseParse = AIEngine.parseResume(text) || { fullName: "Satyaprakash", experience: 0, location: "India", skills: ["Java", "React", "SQL", "MongoDB"] };

      // Look for projects in text
      const projects = [];
      if (/e-?commerce/i.test(text)) {
        projects.push({ name: "E-commerce Web Platform", description: "Full stack shopping portal with product catalog & database persistence." });
      }
      if (/finance|budget|expense/i.test(text)) {
        projects.push({ name: "Finance Management App", description: "Personal budgeting dashboard with transaction filtering and category analytics." });
      }
      if (projects.length === 0) {
        projects.push({ name: "Full Stack Web Application", description: "Built with modern frontend and backend services." });
      }

      // Check certifications
      const certifications = [];
      if (/certified|certification/i.test(text)) {
        certifications.push("Certified Java Developer");
      }

      return {
        fullName: baseParse.fullName || "Satyaprakash",
        title: baseParse.title || "Software Engineer",
        experience: baseParse.experience === 0 ? "Fresher" : `${baseParse.experience} yrs`,
        experienceYears: baseParse.experience || 0,
        location: baseParse.location || "India",
        skills: baseParse.skills.length ? baseParse.skills : ["Java", "React", "SQL", "MongoDB"],
        projects,
        education: "B.Tech in Computer Science & Engineering",
        certifications,
        rawText: text
      };
    }
  },

  /**
   * 3. JOB SEARCH & DISCOVERY AGENT (With Autonomous Adaptation)
   */
  JobSearchAgent: {
    searchJobs: function(goal, jobsList = [], options = {}) {
      const allJobs = Array.isArray(jobsList) && jobsList.length ? jobsList : (typeof DEFAULT_JOBS !== 'undefined' ? DEFAULT_JOBS : []);
      const backupJobs = typeof BACKUP_JOBS_DATASET !== 'undefined' ? BACKUP_JOBS_DATASET : [];

      // Check if simulated tool/API failure is triggered
      if (options.simulateFailure) {
        return {
          source: "BACKUP_DATASET",
          adaptationOccurred: true,
          adaptationLog: "⚠️ Primary Job API 503 error detected. CareerPilot autonomously switched to Backup Job Dataset.",
          jobs: backupJobs.length ? backupJobs : allJobs.slice(0, 3)
        };
      }

      // Filter and rank suitable jobs based on goal role and location
      const targetRoleWords = goal.role.toLowerCase().split(/\s+/);
      const targetLoc = goal.location.toLowerCase();

      let matchedJobs = allJobs.filter(job => {
        const jobTitle = (job.title || "").toLowerCase();
        const jobLoc = (job.location || "").toLowerCase();
        const jobDesc = (job.description || "").toLowerCase();

        const roleMatch = targetRoleWords.some(word => jobTitle.includes(word) || jobDesc.includes(word));
        const isGeneral = /software|developer|engineer|full stack|backend|java|react/i.test(job.title);
        return roleMatch || isGeneral;
      });

      if (!matchedJobs.length) {
        matchedJobs = allJobs;
      }

      return {
        source: "PRIMARY_API",
        adaptationOccurred: false,
        adaptationLog: null,
        jobs: matchedJobs
      };
    }
  },

  /**
   * 4. JOB ANALYZER AGENT
   * Dissects job requirements into Required vs Preferred skills.
   */
  JobAnalyzerAgent: {
    analyzeJob: function(job) {
      const skills = Array.isArray(job.skills) ? job.skills : [];
      let requiredSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
      let preferredSkills = Array.isArray(job.preferredSkills) ? job.preferredSkills : [];

      if (!requiredSkills.length) {
        // Partition default skills: First 60% are required, rest preferred
        const splitIdx = Math.max(2, Math.ceil(skills.length * 0.6));
        requiredSkills = skills.slice(0, splitIdx);
        preferredSkills = skills.slice(splitIdx);
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type || "hybrid",
        salary: job.salary || "Competitive",
        experienceReq: typeof job.experience === 'number' ? job.experience : 0,
        requiredSkills,
        preferredSkills,
        allSkills: skills,
        description: job.description || ""
      };
    }
  },

  /**
   * 5. SKILL MATCHING ENGINE
   * Compares candidate skills against job requirements.
   */
  SkillMatcherAgent: {
    normalizeSkill: function(skill) {
      if (!skill) return "";
      const s = String(skill).toLowerCase().trim();
      if (s === "react.js" || s === "reactjs") return "react";
      if (s === "node" || s === "nodejs" || s === "node.js") return "node.js";
      if (s === "postgres" || s === "postgresql") return "postgresql";
      if (s === "spring" || s === "springboot" || s === "spring-boot") return "spring boot";
      if (s === "mongo" || s === "mongodb") return "mongodb";
      if (s === "amazon web services" || s === "aws cloud") return "aws";
      return s;
    },

    match: function(candidateSkills = [], analyzedJob) {
      const normCandidate = candidateSkills.map(s => CareerPilot.SkillMatcherAgent.normalizeSkill(s));
      const required = analyzedJob.requiredSkills || analyzedJob.allSkills || [];
      const preferred = analyzedJob.preferredSkills || [];

      const matchedRequired = [];
      const missingRequired = [];

      required.forEach(req => {
        const normReq = CareerPilot.SkillMatcherAgent.normalizeSkill(req);
        if (normCandidate.includes(normReq)) {
          matchedRequired.push(req);
        } else {
          missingRequired.push(req);
        }
      });

      const matchedPreferred = [];
      const missingPreferred = [];

      preferred.forEach(pref => {
        const normPref = CareerPilot.SkillMatcherAgent.normalizeSkill(pref);
        if (normCandidate.includes(normPref)) {
          matchedPreferred.push(pref);
        } else {
          missingPreferred.push(pref);
        }
      });

      // Score Calculation
      const reqTotal = Math.max(1, required.length);
      const reqRatio = matchedRequired.length / reqTotal;
      const prefRatio = preferred.length ? (matchedPreferred.length / preferred.length) : 0;

      // Weighted score: 80% required + 20% preferred
      let skillScore = Math.round((reqRatio * 80) + (prefRatio * 20));
      if (required.length && matchedRequired.length === required.length) {
        skillScore = Math.max(skillScore, 90);
      }

      return {
        matchedRequired,
        missingRequired,
        matchedPreferred,
        missingPreferred,
        allMatched: [...matchedRequired, ...matchedPreferred],
        allMissing: [...missingRequired, ...missingPreferred],
        skillScore: Math.min(100, skillScore),
        reqRatio: Math.round(reqRatio * 100)
      };
    }
  },

  /**
   * 6. DECISION AGENT
   * Evaluates overall match and assigns actionable recommendation with reasoned rationale.
   */
  DecisionAgent: {
    evaluate: function(candidateProfile, analyzedJob, matchResult) {
      // Experience compatibility
      const candidateExp = candidateProfile.experienceYears || 0;
      const jobExp = analyzedJob.experienceReq || 0;
      const expDiff = candidateExp - jobExp;
      let expScore = 100;
      if (expDiff < 0) {
        expScore = Math.max(40, 100 - (Math.abs(expDiff) * 25));
      }

      // Location match
      const cLoc = (candidateProfile.location || "").toLowerCase();
      const jLoc = (analyzedJob.location || "").toLowerCase();
      let locScore = (jLoc.includes("remote") || cLoc.includes(jLoc) || jLoc.includes(cLoc) || (cLoc.includes("india") && jLoc.includes("india"))) ? 100 : 75;

      // Overall Composite Score (Skills: 70%, Experience: 20%, Location: 10%)
      const overallScore = Math.round(
        (matchResult.skillScore * 0.70) +
        (expScore * 0.20) +
        (locScore * 0.10)
      );

      // Decision threshold rules:
      // >= 80%  -> APPLY NOW
      // 60-79%  -> PREPARE & APPLY
      // < 60%   -> IMPROVE SKILLS FIRST
      let decision = "IMPROVE_SKILLS";
      let decisionLabel = "Improve Skills First";
      let decisionColor = "red";
      let badgeClass = "badge-improve";
      let reason = "";

      if (overallScore >= 80) {
        decision = "APPLY_NOW";
        decisionLabel = "Apply Now";
        decisionColor = "green";
        badgeClass = "badge-apply";
        reason = `You satisfy ${matchResult.matchedRequired.length} of ${analyzedJob.requiredSkills.length} core technical requirements (${matchResult.matchedRequired.join(", ")}) and meet the fresher/experience criteria.`;
      } else if (overallScore >= 60) {
        decision = "PREPARE_AND_APPLY";
        decisionLabel = "Prepare & Apply";
        decisionColor = "yellow";
        badgeClass = "badge-prepare";
        reason = `Good foundation with ${matchResult.reqRatio}% required skills match. Brush up on ${matchResult.missingRequired.slice(0, 2).join(" and ")} before submitting.`;
      } else {
        decision = "IMPROVE_SKILLS";
        decisionLabel = "Improve Skills First";
        decisionColor = "red";
        badgeClass = "badge-improve";
        reason = `Core prerequisites (${matchResult.missingRequired.join(", ") || "Advanced stack"}) are currently missing. Complete the personalized learning roadmap first.`;
      }

      return {
        overallScore,
        decision,
        decisionLabel,
        decisionColor,
        badgeClass,
        reason,
        expScore,
        locScore
      };
    }
  },

  /**
   * 7. SKILL GAP ANALYZER
   * Aggregates missing skills across all analyzed target opportunities.
   */
  SkillGapAnalyzer: {
    analyze: function(candidateSkills, rankedJobs) {
      const gapCounts = {};
      let totalTargetJobs = rankedJobs.length;

      rankedJobs.forEach(item => {
        const missing = item.matchResult.allMissing || [];
        missing.forEach(skill => {
          gapCounts[skill] = (gapCounts[skill] || 0) + 1;
        });
      });

      const skillGaps = Object.keys(gapCounts).map(skill => {
        const count = gapCounts[skill];
        const percentage = Math.round((count / Math.max(1, totalTargetJobs)) * 100);
        return {
          skill,
          count,
          percentage,
          demandLevel: percentage >= 50 ? "High Demand" : "Moderate Demand"
        };
      }).sort((a, b) => b.count - a.count);

      const topGaps = skillGaps.slice(0, 5);
      const topGapNames = topGaps.map(g => g.skill);

      let summary = "";
      if (topGapNames.length) {
        summary = `Your biggest gaps are ${topGapNames.slice(0, 3).join(", ")}.`;
      } else {
        summary = "No critical skill gaps detected. Profile is fully aligned with market requirements.";
      }

      return {
        skillGaps,
        topGaps,
        topGapNames,
        summary
      };
    }
  },

  /**
   * 8. PERSONALIZED LEARNING PLANNER
   * Generates a 14-Day Career Improvement Plan dynamically tailored to missing skills.
   */
  LearningPlannerAgent: {
    generateRoadmap: function(skillGaps = [], userSkills = [], targetRole = "Software Engineer") {
      const missingNames = Array.isArray(skillGaps) ? skillGaps.map(g => typeof g === 'string' ? g : g.skill) : [];

      // Check what skills need to be covered
      const hasSpringBoot = missingNames.some(s => /spring/i.test(s));
      const hasDocker = missingNames.some(s => /docker/i.test(s));
      const hasAWS = missingNames.some(s => /aws|cloud/i.test(s));
      const hasKubernetes = missingNames.some(s => /kubernetes|k8s/i.test(s));
      const hasKafka = missingNames.some(s => /kafka|redis|mq/i.test(s));
      const hasReact = missingNames.some(s => /react/i.test(s));
      const hasSQL = missingNames.some(s => /sql|postgres|database/i.test(s));

      const days = [
        {
          dayRange: "Day 1–2",
          days: "1-2",
          title: hasSpringBoot ? "Spring Boot Fundamentals" : "Core Framework Fundamentals",
          topics: hasSpringBoot ? ["Spring IoC & Dependency Injection", "Spring Boot Starters & Auto-configuration", "Project Setup with Maven/Gradle"] : ["Core Architecture Fundamentals", "Project Setup & Modern Best Practices"],
          actionItem: "Build a basic Hello World Spring Boot REST controller and verify endpoints."
        },
        {
          dayRange: "Day 3–4",
          days: "3-4",
          title: hasSpringBoot ? "REST APIs & Controller Architecture" : "API Design & Data Flow",
          topics: ["RESTful Resource Design (GET, POST, PUT, DELETE)", "Request Validation & Exception Handling", "DTO Pattern & Response Mapping"],
          actionItem: "Create CRUD endpoints with JSON request validation."
        },
        {
          dayRange: "Day 5",
          days: "5",
          title: (hasSpringBoot && hasSQL) ? "Spring Data JPA & MongoDB Integration" : "Database Persistence Layer",
          topics: ["Spring Data Repositories", "Entity Relationship Mapping (ORM)", "NoSQL MongoDB Document Integration"],
          actionItem: "Connect your backend to PostgreSQL and MongoDB databases."
        },
        {
          dayRange: "Day 6–7",
          days: "6-7",
          title: "Build Capstone Backend Microservice",
          topics: ["Implement E-commerce / Finance API Business Logic", "Authentication with JWT Tokens", "Unit & Integration Testing with JUnit"],
          actionItem: "Assemble an end-to-end backend service with authentication and database storage."
        },
        {
          dayRange: "Day 8",
          days: "8",
          title: hasDocker ? "Docker Fundamentals & Containerization" : "Application Containerization Basics",
          topics: ["Docker Engine Architecture & Images", "Writing Optimized Dockerfiles", "Building & Running Local Containers"],
          actionItem: "Write a multi-stage Dockerfile for your Java / React application."
        },
        {
          dayRange: "Day 9–10",
          days: "9-10",
          title: hasDocker ? "Dockerize Application & Compose Multi-Services" : "Multi-Container Orchestration",
          topics: ["Docker Compose Multi-Container Networking", "Linking Application, Postgres & MongoDB Containers", "Volume Persistence & Environment Variables"],
          actionItem: "Launch full app stack (Frontend + Backend + DB) with a single `docker-compose up`."
        },
        {
          dayRange: "Day 11–12",
          days: "11-12",
          title: hasAWS ? "AWS Cloud Basics & Managed Services" : "Cloud Deployment Architecture",
          topics: ["AWS EC2 Instances & Security Groups", "S3 Bucket Configuration for File Storage", "Cloud Database RDS Setup"],
          actionItem: "Provision a cloud virtual server and upload static assets to AWS S3."
        },
        {
          dayRange: "Day 13",
          days: "13",
          title: "Deploy Project to Cloud & CI/CD",
          topics: ["Deploy Containerized App to Cloud Host", "GitHub Actions Automated Build Pipeline", "Health Check & Environment Configuration"],
          actionItem: "Deploy live URL project and test public API responses."
        },
        {
          dayRange: "Day 14",
          days: "14",
          title: "Technical Interview & System Design Prep",
          topics: ["STAR Method Behavioral Answers", "Common Coding & Data Structures Patterns", "System Design Trade-offs & Resume Polish"],
          actionItem: "Run a mock technical screening interview and submit refreshed job applications."
        }
      ];

      return {
        title: "14-Day Career Improvement Plan",
        duration: "14 Days",
        targetRole,
        focusSkills: missingNames.slice(0, 4),
        roadmap: days
      };
    }
  },

  /**
   * 9. RE-EVALUATION ENGINE
   * Dynamically simulates skill acquisition and updates scores & decisions.
   */
  ReEvaluationEngine: {
    reEvaluate: function(previousResult, newlyCompletedSkill, allJobsList) {
      if (!previousResult || !previousResult.candidateProfile) return null;

      const currentSkills = [...(previousResult.candidateProfile.skills || [])];
      const normNew = newlyCompletedSkill.trim();

      if (!currentSkills.some(s => s.toLowerCase() === normNew.toLowerCase())) {
        currentSkills.push(normNew);
      }

      const updatedProfile = {
        ...previousResult.candidateProfile,
        skills: currentSkills
      };

      // Re-run the planner with updated profile
      const newPlan = CareerPilot.executePlan(
        previousResult.careerGoal,
        updatedProfile,
        allJobsList,
        { simulateFailure: false }
      );

      // Find comparison metrics on top job
      const prevTopJob = previousResult.rankedJobs[0] || null;
      const newTopJob = newPlan.rankedJobs[0] || null;

      const beforeScore = prevTopJob ? prevTopJob.decisionResult.overallScore : 50;
      const afterScore = newTopJob ? newTopJob.decisionResult.overallScore : 75;

      const beforeDecision = prevTopJob ? prevTopJob.decisionResult.decisionLabel : "Improve Skills First";
      const afterDecision = newTopJob ? newTopJob.decisionResult.decisionLabel : "Prepare & Apply";

      return {
        ...newPlan,
        reEvaluationMeta: {
          addedSkill: normNew,
          beforeScore,
          afterScore,
          scoreDelta: afterScore - beforeScore,
          beforeDecision,
          afterDecision,
          upgraded: afterScore > beforeScore
        }
      };
    }
  },

  /**
   * 10. PLANNER AGENT (MAIN LANGGRAPH ORCHESTRATOR)
   * Coordinates the entire multi-agent graph execution.
   */
  executePlan: function(userGoalInput, resumeInput, jobsDataset = [], options = {}) {
    const activityLogs = [];
    const startTime = new Date();

    function logStep(agentName, action, detail, status = "completed") {
      activityLogs.push({
        id: `step-${activityLogs.length + 1}`,
        agent: agentName,
        action,
        detail,
        status,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }

    logStep("Planner Agent", "Initialize Graph", "Starting LangGraph multi-agent execution pipeline.");

    // Node 1: Career Goal Understanding Agent
    const careerGoal = CareerPilot.CareerGoalAgent.understandGoal(userGoalInput);
    logStep("Career Goal Agent", "Analyze Goal", `Parsed goal: ${careerGoal.role} (${careerGoal.experience}) in ${careerGoal.location}.`);

    // Node 2: Resume Analyzer Agent
    const candidateProfile = CareerPilot.ResumeAnalyzerAgent.analyzeResume(resumeInput);
    logStep("Resume Agent", "Extract Profile", `Extracted ${candidateProfile.skills.length} skills (${candidateProfile.skills.slice(0, 4).join(", ")}), ${candidateProfile.projects.length} projects.`);

    // Node 3: Job Search Agent (with Adaptation)
    const searchResult = CareerPilot.JobSearchAgent.searchJobs(careerGoal, jobsDataset, options);
    if (searchResult.adaptationOccurred) {
      logStep("Job Search Agent", "API Fault Detected", "Primary Job API 503 error encountered.", "adapted");
      logStep("Adaptation Agent", "Failover Executed", searchResult.adaptationLog, "adapted");
    } else {
      logStep("Job Search Agent", "Query Opportunities", `Discovered ${searchResult.jobs.length} potential matching jobs from market feeds.`);
    }

    // Node 4 & 5: Job Analyzer + Skill Matcher + Decision Agent
    const rankedJobs = [];

    searchResult.jobs.forEach(rawJob => {
      const analyzedJob = CareerPilot.JobAnalyzerAgent.analyzeJob(rawJob);
      const matchResult = CareerPilot.SkillMatcherAgent.match(candidateProfile.skills, analyzedJob);
      const decisionResult = CareerPilot.DecisionAgent.evaluate(candidateProfile, analyzedJob, matchResult);

      rankedJobs.push({
        job: analyzedJob,
        matchResult,
        decisionResult
      });
    });

    // Rank jobs by overall score descending
    rankedJobs.sort((a, b) => b.decisionResult.overallScore - a.decisionResult.overallScore);
    logStep("Job Analyzer", "Analyze Requirements", `Dissected required & preferred skill criteria for ${rankedJobs.length} jobs.`);
    logStep("Skill Matcher", "Evaluate Compatibility", `Calculated skill overlaps, experience weights, and location alignments.`);
    logStep("Decision Agent", "Assign Recommendations", `Generated 3-tier actionable decisions (Apply Now, Prepare & Apply, Improve Skills).`);

    // Node 6: Skill Gap Analyzer
    const gapAnalysis = CareerPilot.SkillGapAnalyzer.analyze(candidateProfile.skills, rankedJobs);
    logStep("Skill Gap Agent", "Aggregate Gaps", gapAnalysis.summary);

    // Node 7: Personalized Learning Planner
    const learningPlan = CareerPilot.LearningPlannerAgent.generateRoadmap(
      gapAnalysis.topGaps,
      candidateProfile.skills,
      careerGoal.role
    );
    logStep("Learning Planner", "Generate 14-Day Roadmap", `Crafted personalized curriculum targeting: ${learningPlan.focusSkills.join(", ") || "Advanced Architecture"}.`);

    // Compute Overview Metrics
    const strongMatchesCount = rankedJobs.filter(j => j.decisionResult.decision === "APPLY_NOW").length;
    const prepareMatchesCount = rankedJobs.filter(j => j.decisionResult.decision === "PREPARE_AND_APPLY").length;
    const improveSkillsCount = rankedJobs.filter(j => j.decisionResult.decision === "IMPROVE_SKILLS").length;

    // Calculate overall resume score
    const avgScore = rankedJobs.length ? Math.round(rankedJobs.reduce((acc, curr) => acc + curr.decisionResult.overallScore, 0) / rankedJobs.length) : 75;

    logStep("Planner Agent", "Assemble Output", "LangGraph pipeline completed successfully. CareerPilot dashboard compiled.");

    return {
      careerGoal,
      candidateProfile,
      rankedJobs,
      gapAnalysis,
      learningPlan,
      activityLogs,
      adaptationStatus: {
        occurred: searchResult.adaptationOccurred,
        log: searchResult.adaptationLog,
        source: searchResult.source
      },
      metrics: {
        careerGoalText: `${careerGoal.role} (${careerGoal.experience})`,
        resumeScore: avgScore,
        jobsAnalyzed: rankedJobs.length,
        strongMatches: strongMatchesCount,
        prepareMatches: prepareMatchesCount,
        improveSkills: improveSkillsCount,
        skillGapsCount: gapAnalysis.topGaps.length,
        recommendedCount: Math.min(rankedJobs.length, 6)
      },
      generatedAt: new Date().toISOString()
    };
  },

  /* ==========================================================================
     NODE 8: AI INTERVIEWER AGENT (Autonomous Live Screening & In-Memory Recording)
     ========================================================================== */
  AIInterviewAgent: {
    name: "AI Interviewer Agent",
    description: "Conducts adaptive multi-round technical & STAR behavioral interviews, scores responses in real-time, and generates structured interview dossiers.",

    /**
     * Generates a customized set of technical & behavioral questions based on candidate profile & job mandate.
     */
    generateQuestions: function(candidate, job) {
      const role = (job && job.title) || (candidate && candidate.title) || "Software Engineer";
      const candidateSkills = (candidate && candidate.skills) || ["JavaScript", "React", "Node.js"];
      const primarySkill = candidateSkills[0] || "JavaScript";
      const secondarySkill = candidateSkills[1] || "React";

      return [
        {
          id: "q1",
          type: "intro",
          category: "Background & Technical Journey",
          question: `Hello ${candidate.fullName ? candidate.fullName.split(' ')[0] : 'there'}! Welcome to the AI Technical Screening for the ${role} position at ${job.company || 'our team'}. Could you give a concise summary of your technical background and the most impactful project you've built using ${primarySkill}?`,
          targetCompetency: "Communication, Technical Depth & Project Ownership",
          recommendedKeywords: [primarySkill.toLowerCase(), "project", "architecture", "scale", "performance", "build", "api", "database", "user"],
          starCriteria: "Clear explanation of project scope, personal contributions, and measurable outcomes."
        },
        {
          id: "q2",
          type: "technical_deep_dive",
          category: `Core ${primarySkill} & ${secondarySkill} Internals`,
          question: `Let's dive into ${primarySkill} and ${secondarySkill}. How do you handle asynchronous operations, state management, and memory/performance bottlenecks in production systems? Explain with a concrete technical scenario you've tackled.`,
          targetCompetency: "Language Internals, Async Paradigms, Optimization",
          recommendedKeywords: ["async", "await", "promise", "state", "optimization", "render", "memory", "caching", "event loop", "lifecycle", "query"],
          starCriteria: "Accurate technical terminology, understanding of concurrency/state, and proactive performance reasoning."
        },
        {
          id: "q3",
          type: "system_design",
          category: "System Design & Scalability",
          question: `Imagine we need to design a real-time notification service for millions of active users with sub-second latency. What architecture, message brokers, and database indexing strategies would you select, and how would you handle service failovers?`,
          targetCompetency: "System Architecture, Resiliency & Scalability",
          recommendedKeywords: ["websocket", "redis", "kafka", "queue", "database", "indexing", "sharding", "cache", "load balancer", "failover", "latency", "microservices"],
          starCriteria: "Component decomposition, clear tradeoff analysis, and robust error/failover strategy."
        },
        {
          id: "q4",
          type: "behavioral_star",
          category: "Behavioral & Conflict Resolution (STAR)",
          question: `Tell me about a time when you faced a critical production bug or a sharp disagreement with a team member about technical direction. How did you diagnose the situation, take action, and what was the resolution?`,
          targetCompetency: "STAR Methodology, Collaboration & Problem Solving Under Pressure",
          recommendedKeywords: ["situation", "task", "action", "result", "team", "collaborate", "debug", "resolved", "communication", "solution", "improved"],
          starCriteria: "Strict STAR structure: Context/Situation, Specific Task, Proactive Action, Quantifiable Result."
        }
      ];
    },

    /**
     * Evaluates candidate's answer with semantic NLP scoring and STAR criteria.
     */
    evaluateAnswer: function(questionObj, answerText, candidate, job) {
      if (!answerText || answerText.trim().length < 5) {
        return {
          technicalScore: 40,
          communicationScore: 45,
          starScore: 40,
          overallScore: 42,
          feedback: "Answer was very brief. Elaborate with specific code examples, architectural tradeoffs, and quantifiable results.",
          keywordsDetected: []
        };
      }

      const textLower = answerText.toLowerCase();
      const words = answerText.trim().split(/\s+/).length;
      
      // Keyword matching
      const detectedKeywords = [];
      if (questionObj.recommendedKeywords) {
        questionObj.recommendedKeywords.forEach(kw => {
          if (textLower.includes(kw.toLowerCase())) {
            detectedKeywords.push(kw);
          }
        });
      }

      // Depth factor
      let depthScore = 20;
      if (words >= 30) depthScore = 30;
      else if (words >= 15) depthScore = 25;

      // STAR indicator check for behavioral & technical reasoning
      let starScoreBonus = 0;
      const starMarkers = ["situation", "task", "action", "result", "because", "impact", "led to", "resolved", "improved", "implemented", "designed", "optimized", "reduced", "increased"];
      starMarkers.forEach(marker => {
        if (textLower.includes(marker)) starScoreBonus += 6;
      });
      // Metric numbers check (e.g. 65%, 2 weeks, 100ms)
      if (/\d+[%ms|x|k|years|days|users]*/i.test(answerText)) {
        starScoreBonus += 10;
      }
      starScoreBonus = Math.min(starScoreBonus, 35);

      // Scoring components
      const keywordScore = Math.min(40, detectedKeywords.length * 12);
      const technicalScore = Math.min(100, 50 + keywordScore + Math.round(depthScore * 0.3));
      const communicationScore = Math.min(100, 60 + depthScore + Math.min(10, detectedKeywords.length * 3));
      const starScore = Math.min(100, 55 + starScoreBonus + Math.min(10, detectedKeywords.length * 2));

      const overallScore = Math.round((technicalScore * 0.40) + (communicationScore * 0.30) + (starScore * 0.30));

      // Constructive AI Feedback
      let feedback = "";
      if (overallScore >= 85) {
        feedback = `Excellent technical response! Clearly demonstrated strong grasp of ${detectedKeywords.slice(0, 3).join(", ") || "core concepts"} with structured execution.`;
      } else if (overallScore >= 70) {
        feedback = `Solid answer covering key fundamentals. Consider highlighting deeper optimization tradeoffs and system metrics.`;
      } else {
        feedback = `Reasonable foundation. Recommendation: Structure your answer using the STAR method and include concrete framework metrics.`;
      }

      return {
        technicalScore,
        communicationScore,
        starScore,
        overallScore,
        feedback,
        keywordsDetected: detectedKeywords
      };
    },

    /**
     * Compiles complete interview session into an in-memory dossier with hire recommendation.
     */
    compileSessionDossier: function(session) {
      const qaList = session.qaHistory || [];
      if (qaList.length === 0) {
        return {
          overallScore: 70,
          technicalScore: 70,
          communicationScore: 70,
          starScore: 70,
          recommendation: "Leaning Hire",
          summary: "Interview completed with basic metrics.",
          strengths: ["Willingness to participate"],
          improvements: ["Provide more depth in technical answers"]
        };
      }

      const avgOverall = Math.round(qaList.reduce((acc, q) => acc + (q.evaluation ? q.evaluation.overallScore : 75), 0) / qaList.length);
      const avgTech = Math.round(qaList.reduce((acc, q) => acc + (q.evaluation ? q.evaluation.technicalScore : 75), 0) / qaList.length);
      const avgComm = Math.round(qaList.reduce((acc, q) => acc + (q.evaluation ? q.evaluation.communicationScore : 75), 0) / qaList.length);
      const avgStar = Math.round(qaList.reduce((acc, q) => acc + (q.evaluation ? q.evaluation.starScore : 75), 0) / qaList.length);

      let recommendation = "Hire";
      let recommendationBadge = "hire";
      if (avgOverall >= 88) {
        recommendation = "Strong Hire";
        recommendationBadge = "strong_hire";
      } else if (avgOverall >= 75) {
        recommendation = "Hire";
        recommendationBadge = "hire";
      } else if (avgOverall >= 60) {
        recommendation = "Leaning Hire";
        recommendationBadge = "leaning_hire";
      } else {
        recommendation = "Needs Improvement";
        recommendationBadge = "needs_improvement";
      }

      const allDetectedKeywords = [];
      qaList.forEach(q => {
        if (q.evaluation && q.evaluation.keywordsDetected) {
          q.evaluation.keywordsDetected.forEach(k => {
            if (!allDetectedKeywords.includes(k)) allDetectedKeywords.push(k);
          });
        }
      });

      const strengths = [
        `Strong articulation of ${allDetectedKeywords.slice(0, 3).join(", ") || "core technical concepts"}.`,
        `Demonstrated structured problem-solving approach (STAR rating: ${avgStar}%).`,
        `Solid communication clarity across technical and behavioral rounds.`
      ];

      const improvements = [
        `Deepen benchmark testing explanations and latency optimization strategies.`,
        `Include more quantifiable production metrics (e.g. % performance increase, scale metrics).`
      ];

      return {
        overallScore: avgOverall,
        technicalScore: avgTech,
        communicationScore: avgComm,
        starScore: avgStar,
        recommendation,
        recommendationBadge,
        detectedKeywords: allDetectedKeywords,
        strengths,
        improvements,
        evaluatedAt: new Date().toISOString()
      };
    }
  }

};

// Expose AIInterviewAgent on AIEngine
AIEngine.AIInterviewAgent = CareerPilot.AIInterviewAgent;

// Expose CareerPilot globally and on AIEngine
if (typeof AIEngine !== 'undefined') {
  AIEngine.CareerPilot = CareerPilot;
}

if (typeof window !== 'undefined') {
  window.CareerPilot = CareerPilot;
}

if (typeof module !== 'undefined') {
  module.exports = {
    AIEngine,
    CareerPilot
  };
}

