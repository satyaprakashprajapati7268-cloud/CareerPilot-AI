/* ==========================================================================
   SmartHire - AI Matching Algorithm Test Harness
   ========================================================================== */

const fs = require('fs');
const path = require('path');

// Load ai-engine.js context into Node
const aiEnginePath = path.join(__dirname, 'ai-engine.js');
let aiEngineCode = fs.readFileSync(aiEnginePath, 'utf8');

// Append module export to the code for evaluation
aiEngineCode += '\nmodule.exports = AIEngine;';

// Evaluate and get engine
const AIEngine = eval(aiEngineCode);

console.log("--------------------------------------------------");
console.log("RUNNING AI MATCHING ALGORITHM VERIFICATION TESTS");
console.log("--------------------------------------------------");

// Test Case 1: Perfect Match
const seeker1 = {
  fullName: "John Doe",
  title: "Frontend Developer",
  experience: 5,
  location: "Remote",
  skills: ["HTML", "CSS", "JavaScript", "React"]
};

const job1 = {
  title: "Frontend Developer",
  experience: 5,
  location: "Remote",
  type: "remote",
  skills: ["HTML", "CSS", "JavaScript", "React"]
};

const match1 = AIEngine.calculateMatchScore(seeker1, job1);
console.log(`Test 1 (Perfect Match): Overall: ${match1.overall}% (Expected: 100%)`);
console.log(`   Breakdowns: Skills: ${match1.skills}%, Exp: ${match1.experience}%, Loc: ${match1.location}%`);
if (match1.overall !== 100) {
  console.error("❌ Test 1 Failed: Perfect match did not yield 100%");
  process.exit(1);
}

// Test Case 2: Partial Match (Skills missing, lower experience)
const seeker2 = {
  fullName: "Jane Smith",
  title: "Frontend Developer",
  experience: 2,
  location: "New York, NY",
  skills: ["HTML", "CSS", "JavaScript"] // Missing React
};

const job2 = {
  title: "Frontend Developer",
  experience: 4,
  location: "New York, NY",
  type: "on-site",
  skills: ["HTML", "CSS", "JavaScript", "React"] // 3/4 matched
};

const match2 = AIEngine.calculateMatchScore(seeker2, job2);
console.log(`Test 2 (Partial Match): Overall: ${match2.overall}%`);
console.log(`   Breakdowns: Skills: ${match2.skills}% (Expected: 75%), Exp: ${match2.experience}% (Expected: 50%), Loc: ${match2.location}% (Expected: 100%)`);

// Calculation validation:
// Skills: 75% * 0.50 = 37.5
// Experience: 50% * 0.35 = 17.5
// Location: 100% * 0.15 = 15
// Total: 37.5 + 17.5 + 15 = 70%
if (match2.overall !== 70) {
  console.error(`❌ Test 2 Failed: Expected 70%, got ${match2.overall}%`);
  process.exit(1);
}

// Test Case 3: Resume Parser Simulation verification
const sampleResume = `
Jane Doe
Senior Backend Architect
jane.doe@email.com
Location: Austin, TX

SUMMARY
8+ years of work experience in software development. Expert in Node.js, Express, PostgreSQL, AWS, and Git.

EDUCATION
M.S. in Computer Science
`;

const parsed = AIEngine.parseResume(sampleResume);
console.log("Test 3 (Resume Parser Simulation):");
console.log(`   Parsed Name: "${parsed.fullName}" (Expected: "Jane Doe")`);
console.log(`   Parsed Title: "${parsed.title}" (Expected: "Backend Architect")`);
console.log(`   Parsed Experience: ${parsed.experience} (Expected: 8)`);
console.log(`   Parsed Location: "${parsed.location}" (Expected: "Austin")`);
console.log(`   Parsed Skills: [${parsed.skills.join(', ')}]`);

if (parsed.fullName !== "Jane Doe" || parsed.experience !== 8 || parsed.location !== "Austin" || !parsed.skills.includes("Node.js")) {
  console.error("❌ Test 3 Failed: Parsed values do not match expected regex matches");
  process.exit(1);
}

// Test Case 4: ATS Resume Evaluation
const atsResult = AIEngine.evaluateResumeForATS({
  fullName: "Jane Doe",
  email: "jane.doe@email.com",
  experience: 8,
  skills: ["Node.js", "Express", "PostgreSQL", "AWS", "Git"],
  summary: "Senior software engineer with 8 years of experience building scalable backend microservices."
});
console.log("Test 4 (ATS Resume Evaluation):");
console.log(`   Health Score: ${atsResult.score}/100 (Expected: 100)`);
console.log(`   Checklist Items: ${atsResult.items.filter(i => i.passed).length}/${atsResult.items.length}`);
if (atsResult.score !== 100) {
  console.error("❌ Test 4 Failed: Expected ATS health score 100");
  process.exit(1);
}

// Test Case 5: Recruitment Analytics Generation
const sampleJobs = [job1, job2];
const sampleApps = [
  { status: 'Applied', score: 90 },
  { status: 'Screening', score: 70 },
  { status: 'Interview', score: 85 }
];
const analytics = AIEngine.generateAnalytics(sampleJobs, sampleApps, seeker1);
console.log("Test 5 (Analytics Generation):");
console.log(`   Total Apps: ${analytics.totalApps}, Applied: ${analytics.funnel.applied}, Screening: ${analytics.funnel.screening}, Interview: ${analytics.funnel.interview}`);
console.log(`   Avg Score: ${analytics.avgScore}%`);
if (analytics.totalApps !== 3 || analytics.funnel.applied !== 1) {
  console.error("❌ Test 5 Failed: Analytics funnel counts mismatch");
  process.exit(1);
}

// Test Case 6: Detailed STAR Interview Evaluation
const sampleAns = "When I was lead engineer at Acme Corp, we were tasked with optimizing our read-heavy database API. I built a Redis caching layer and implemented query indexing. As a result, we reduced API response latency by 45% and improved overall throughput.";
const evalResult = AIEngine.evaluateInterviewResponseDetailed("Describe a performance optimization.", sampleAns, "Backend Architect");
console.log("Test 6 (STAR Interview Evaluation):");
console.log(`   Overall Score: ${evalResult.overallScore}%`);
console.log(`   STAR Score: ${evalResult.starScore}% (Expected: 100%)`);
if (evalResult.starScore !== 100 || evalResult.overallScore < 70) {
  console.error("❌ Test 6 Failed: STAR evaluation missed key indicators");
  process.exit(1);
}

// --------------------------------------------------
// CAREERPILOT MULTI-AGENT ARCHITECTURE TESTS
// --------------------------------------------------
const { DEFAULT_JOBS, SATYAPRAKASH_PROFILE, BACKUP_JOBS_DATASET } = require('./data-mock.js');
const CareerPilot = AIEngine.CareerPilot;

// Test 7: Career Goal Understanding Agent
console.log("Test 7 (Career Goal Understanding Agent):");
const goal1 = CareerPilot.CareerGoalAgent.understandGoal("Mujhe India mein Software Engineer ki job chahiye.");
console.log(`   Parsed Role: "${goal1.role}", Exp: "${goal1.experience}", Loc: "${goal1.location}"`);
if (goal1.role !== "Software Engineer" || goal1.experience !== "Fresher" || goal1.location !== "India") {
  console.error("❌ Test 7 Failed: Natural language goal parsing failed");
  process.exit(1);
}

// Test 8: Resume Analyzer Agent
console.log("Test 8 (Resume Analyzer Agent):");
const parsedResume = CareerPilot.ResumeAnalyzerAgent.analyzeResume(SATYAPRAKASH_PROFILE);
console.log(`   Extracted Name: "${parsedResume.fullName}", Skills: [${parsedResume.skills.join(', ')}]`);
console.log(`   Projects Count: ${parsedResume.projects.length} (${parsedResume.projects.map(p => p.name).join('; ')})`);
if (parsedResume.fullName !== "Satyaprakash" || !parsedResume.skills.includes("Java") || !parsedResume.skills.includes("React") || parsedResume.projects.length < 2) {
  console.error("❌ Test 8 Failed: Resume analysis failed to extract core entities");
  process.exit(1);
}

// Test 9: Skill Matching Engine & Decision Agent Evaluation
console.log("Test 9 (Skill Matcher & Decision Agent):");
const testJobMatch1 = {
  id: "test-j1",
  title: "Software Engineer",
  company: "ABC Tech",
  location: "Bangalore, India",
  experienceReq: 0,
  requiredSkills: ["Java", "SQL", "React"],
  preferredSkills: ["MongoDB", "Spring Boot"]
};
const matchRes1 = CareerPilot.SkillMatcherAgent.match(parsedResume.skills, testJobMatch1);
const decRes1 = CareerPilot.DecisionAgent.evaluate(parsedResume, testJobMatch1, matchRes1);
console.log(`   Match Score: ${decRes1.overallScore}%, Decision: ${decRes1.decisionLabel} (${decRes1.decision})`);
console.log(`   Matched Skills: [${matchRes1.allMatched.join(', ')}], Missing: [${matchRes1.allMissing.join(', ')}]`);
if (decRes1.decision !== "APPLY_NOW" || decRes1.overallScore < 80) {
  console.error("❌ Test 9 Failed: Top match did not qualify for APPLY_NOW decision");
  process.exit(1);
}

// Test 10: Skill Gap Analyzer
console.log("Test 10 (Skill Gap Analyzer):");
const fullPlan = CareerPilot.executePlan(goal1, parsedResume, DEFAULT_JOBS);
console.log(`   Top Identified Gaps: [${fullPlan.gapAnalysis.topGapNames.join(', ')}]`);
console.log(`   Summary: "${fullPlan.gapAnalysis.summary}"`);
if (!fullPlan.gapAnalysis.topGapNames.length) {
  console.error("❌ Test 10 Failed: Skill gap analysis returned empty gaps");
  process.exit(1);
}

// Test 11: 14-Day Personalized Learning Planner
console.log("Test 11 (14-Day Learning Planner):");
const roadmap = fullPlan.learningPlan.roadmap;
console.log(`   Roadmap Title: "${fullPlan.learningPlan.title}", Milestones: ${roadmap.length}`);
console.log(`   Day 1-2 Milestone: "${roadmap[0].title}"`);
console.log(`   Day 14 Milestone: "${roadmap[roadmap.length - 1].title}"`);
if (roadmap.length !== 9 || !fullPlan.learningPlan.title.includes("14-Day")) {
  console.error("❌ Test 11 Failed: 14-day roadmap structure invalid");
  process.exit(1);
}

// Test 12: Autonomous Adaptation & Failover Resilience
console.log("Test 12 (Autonomous Adaptation & API Failover):");
const adaptedPlan = CareerPilot.executePlan(goal1, parsedResume, DEFAULT_JOBS, { simulateFailure: true });
console.log(`   Adaptation Triggered: ${adaptedPlan.adaptationStatus.occurred}`);
console.log(`   Adaptation Source: "${adaptedPlan.adaptationStatus.source}"`);
console.log(`   Log: "${adaptedPlan.adaptationStatus.log}"`);
if (!adaptedPlan.adaptationStatus.occurred || adaptedPlan.adaptationStatus.source !== "BACKUP_DATASET") {
  console.error("❌ Test 12 Failed: Failover adaptation did not trigger successfully");
  process.exit(1);
}

// Test 13: Dynamic Re-Evaluation Engine
console.log("Test 13 (Dynamic Re-Evaluation Engine):");
const reEval = CareerPilot.ReEvaluationEngine.reEvaluate(adaptedPlan, "Spring Boot", DEFAULT_JOBS);
console.log(`   Added Skill: "${reEval.reEvaluationMeta.addedSkill}"`);
console.log(`   Score Before: ${reEval.reEvaluationMeta.beforeScore}% ➔ After: ${reEval.reEvaluationMeta.afterScore}% (+${reEval.reEvaluationMeta.scoreDelta}%)`);
console.log(`   Decision Upgrade: "${reEval.reEvaluationMeta.beforeDecision}" ➔ "${reEval.reEvaluationMeta.afterDecision}"`);
if (!reEval.reEvaluationMeta.upgraded || reEval.reEvaluationMeta.afterScore <= reEval.reEvaluationMeta.beforeScore) {
  console.error("❌ Test 13 Failed: Dynamic re-evaluation failed to upgrade score");
  process.exit(1);
}

// Test 14: AI Interviewer Agent Question Generation
console.log("Test 14 (AI Interviewer Agent - Adaptive Q&A Generation):");
const interviewQuestions = CareerPilot.AIInterviewAgent.generateQuestions(SATYAPRAKASH_PROFILE, DEFAULT_JOBS[0]);
console.log(`   Generated ${interviewQuestions.length} Questions for Role: ${DEFAULT_JOBS[0].title}`);
console.log(`   Question 1 Category: "${interviewQuestions[0].category}"`);
console.log(`   Question 4 Category: "${interviewQuestions[3].category}"`);
if (interviewQuestions.length !== 4 || !interviewQuestions[3].category.includes("STAR")) {
  console.error("❌ Test 14 Failed: AI Interviewer Question Generation failed");
  process.exit(1);
}

// Test 15: AI Interviewer Real-Time Evaluation & In-Memory Dossier Compilation
console.log("Test 15 (AI Interviewer Evaluation & In-Memory Dossier):");
const mockAnswer = "In my previous project, we faced high latency. I optimized database queries with indexes and implemented Redis caching, which reduced API response time by 65%.";
const interviewEvalResult = CareerPilot.AIInterviewAgent.evaluateAnswer(interviewQuestions[1], mockAnswer, SATYAPRAKASH_PROFILE, DEFAULT_JOBS[0]);
console.log(`   Answer Overall Score: ${interviewEvalResult.overallScore}% (Tech: ${interviewEvalResult.technicalScore}%, STAR: ${interviewEvalResult.starScore}%)`);
console.log(`   Feedback: "${interviewEvalResult.feedback}"`);

const mockSession = {
  candidateName: "Satyaprakash",
  jobTitle: "Software Engineer",
  company: "Google DeepMind",
  qaHistory: [
    { questionIndex: 1, evaluation: interviewEvalResult },
    { questionIndex: 2, evaluation: interviewEvalResult },
    { questionIndex: 3, evaluation: interviewEvalResult },
    { questionIndex: 4, evaluation: interviewEvalResult }
  ]
};
const compiledDossier = CareerPilot.AIInterviewAgent.compileSessionDossier(mockSession);
console.log(`   Compiled Dossier Score: ${compiledDossier.overallScore}%, Recommendation: ${compiledDossier.recommendation}`);
if (compiledDossier.overallScore < 70 || !compiledDossier.recommendation) {
  console.error("❌ Test 15 Failed: Dossier compilation failed");
  process.exit(1);
}

console.log("--------------------------------------------------");
console.log("✅ ALL 15 VERIFICATION TESTS PASSED WITH 100% SUCCESS!");
console.log("--------------------------------------------------");
process.exit(0);

