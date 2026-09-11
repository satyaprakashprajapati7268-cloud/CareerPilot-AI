/* ==========================================================================
   SmartHire Mock Database Seeds
   ========================================================================== */

const DEFAULT_JOBS = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    company: "Google DeepMind",
    location: "London, UK",
    type: "hybrid",
    experience: 3,
    salary: "$110,000 - $140,000",
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "TypeScript"],
    description: "We are looking for a Frontend Engineer to construct advanced, responsive web applications for AI agent visualizations. You will collaborate with researchers to build high-performance systems."
  },
  {
    id: "job-2",
    title: "Backend Architect",
    company: "Stripe",
    location: "San Francisco, CA",
    type: "remote",
    experience: 7,
    salary: "$160,000 - $210,000",
    skills: ["Node.js", "Express", "PostgreSQL", "System Design", "AWS", "Git"],
    description: "Lead the design and development of our primary ledger and payment processing pipelines. Ensure high reliability, security, and scaling of low-latency transaction processing APIs."
  },
  {
    id: "job-3",
    title: "Data Scientist",
    company: "Netflix",
    location: "Los Gatos, CA",
    type: "on-site",
    experience: 4,
    salary: "$140,000 - $180,000",
    skills: ["Python", "SQL", "Pandas", "Scikit-Learn", "Machine Learning", "Statistics"],
    description: "Analyze viewer metrics and design personalization matching models. You will be responsible for defining recommendation rules and tracking pipeline accuracy scores."
  },
  {
    id: "job-4",
    title: "Product Manager",
    company: "Vercel",
    location: "Remote",
    type: "remote",
    experience: 5,
    salary: "$130,000 - $165,000",
    skills: ["Product Roadmap", "UX Design", "Web Development", "Analytics", "Agile"],
    description: "Own the developer tools experience. Help make hosting and front-end development frictionless for millions of users worldwide."
  },
  {
    id: "job-5",
    title: "Full Stack Developer",
    company: "Linear",
    location: "New York, NY",
    type: "hybrid",
    experience: 2,
    salary: "$95,000 - $120,000",
    skills: ["React", "Node.js", "PostgreSQL", "CSS", "TypeScript", "Git"],
    description: "Help build the fastest project manager tool. You will work across the React client-side logic and Node.js transactional layers to launch polished features."
  },
  {
    id: "job-6",
    title: "Machine Learning Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    type: "on-site",
    experience: 5,
    salary: "$180,000 - $240,000",
    skills: ["Python", "Machine Learning", "AWS", "Git", "TypeScript"],
    description: "Train and fine-tune next-generation generative AI agent systems. Design robust datasets, manage scalable training hardware configs, and deploy reasoning wrappers."
  },
  {
    id: "job-7",
    title: "iOS Developer",
    company: "Apple",
    location: "Cupertino, CA",
    type: "hybrid",
    experience: 4,
    salary: "$130,000 - $170,000",
    skills: ["Swift", "iOS", "Git", "UX Design", "TypeScript"],
    description: "Build state of the art user interfaces for native core applications. Craft responsive UI controls and smooth animation frameworks."
  },
  {
    id: "job-8",
    title: "Cloud Security Architect",
    company: "Microsoft",
    location: "Redmond, WA",
    type: "remote",
    experience: 8,
    salary: "$170,000 - $220,000",
    skills: ["AWS", "System Design", "Git", "SQL", "Network Security"],
    description: "Secure cloud platform instances across our enterprise networks. Define standard security protocols, conduct audits, and manage secure identity pipelines."
  },
  {
    id: "job-9",
    title: "UI/UX Designer",
    company: "Airbnb",
    location: "Remote",
    type: "remote",
    experience: 3,
    salary: "$100,000 - $130,000",
    skills: ["UX Design", "Figma", "HTML", "CSS"],
    description: "Reimagine the customer booking process. Design high-fidelity visual assets, outline core interface layouts, and coordinate with engineering teams."
  },
  {
    id: "job-10",
    title: "DevOps Engineer",
    company: "HashiCorp",
    location: "Seattle, WA",
    type: "hybrid",
    experience: 3,
    salary: "$110,000 - $145,000",
    skills: ["AWS", "Docker", "Git", "Node.js", "System Design"],
    requiredSkills: ["AWS", "Docker", "Git"],
    preferredSkills: ["Kubernetes", "Terraform", "CI/CD"],
    description: "Streamline our deployment pipelines and build infrastructure tools. Manage Kubernetes configurations and orchestrate cloud resource templates."
  },
  {
    id: "job-11",
    title: "Software Engineer",
    company: "ABC Tech",
    location: "Bangalore, India",
    type: "hybrid",
    experience: 0,
    salary: "₹8,00,000 - ₹12,00,000",
    skills: ["Java", "SQL", "React", "MongoDB"],
    requiredSkills: ["Java", "SQL", "React"],
    preferredSkills: ["MongoDB", "Spring Boot", "Git"],
    description: "We are seeking a fresh Graduate / Junior Software Engineer to join our rapid innovation team in Bangalore. Work on microservices and modern React frontend portals."
  },
  {
    id: "job-12",
    title: "Java Developer",
    company: "XYZ Innovations",
    location: "Hyderabad, India",
    type: "on-site",
    experience: 0,
    salary: "₹7,50,000 - ₹11,00,000",
    skills: ["Java", "Spring Boot", "SQL", "Docker"],
    requiredSkills: ["Java", "Spring Boot", "SQL", "Docker"],
    preferredSkills: ["AWS", "Kubernetes", "Microservices"],
    description: "Join XYZ Innovations as a Java backend developer building high-throughput financial transactions processing systems. Hands-on Java & Spring Boot required."
  },
  {
    id: "job-13",
    title: "Cloud & Platform Engineer",
    company: "Tech Corp",
    location: "Pune, India",
    type: "remote",
    experience: 1,
    salary: "₹9,00,000 - ₹14,00,000",
    skills: ["Docker", "AWS", "Kubernetes", "Linux", "Python", "CI/CD"],
    requiredSkills: ["Docker", "AWS", "Kubernetes", "Linux"],
    preferredSkills: ["Terraform", "Go", "Prometheus"],
    description: "Build robust cloud infrastructure and containerized microservice clusters on AWS for next-gen platform workflows."
  },
  {
    id: "job-14",
    title: "Full Stack Developer",
    company: "Swiggy",
    location: "Bangalore, India",
    type: "hybrid",
    experience: 1,
    salary: "₹12,00,000 - ₹18,00,000",
    skills: ["React", "Java", "MongoDB", "SQL", "Node.js"],
    requiredSkills: ["React", "Java", "SQL"],
    preferredSkills: ["MongoDB", "Redis", "Kafka"],
    description: "Design real-time delivery logistics and consumer order tracking web interfaces with scalable Java and React full-stack architectures."
  },
  {
    id: "job-15",
    title: "Graduate Software Engineer",
    company: "Amazon",
    location: "Hyderabad, India",
    type: "on-site",
    experience: 0,
    salary: "₹14,00,000 - ₹20,00,000",
    skills: ["Java", "SQL", "Data Structures", "Algorithms", "AWS"],
    requiredSkills: ["Java", "SQL", "Data Structures"],
    preferredSkills: ["AWS", "Distributed Systems", "Object Oriented Design"],
    description: "Amazon is hiring university graduates and freshers for core software engineering roles. Build planet-scale customer fulfillment services."
  },
  {
    id: "job-16",
    title: "Backend Developer (Node / Java)",
    company: "PhonePe",
    location: "Bangalore, India",
    type: "hybrid",
    experience: 1,
    salary: "₹10,00,000 - ₹16,00,000",
    skills: ["Java", "Spring Boot", "SQL", "Redis", "Kafka"],
    requiredSkills: ["Java", "SQL", "Spring Boot"],
    preferredSkills: ["Redis", "Kafka", "Docker"],
    description: "Power millions of UPI digital transactions daily with zero downtime backend systems. Strong database and Java skills expected."
  },
  {
    id: "job-17",
    title: "Junior React Developer",
    company: "Razorpay",
    location: "Bangalore, India",
    type: "remote",
    experience: 0,
    salary: "₹8,50,000 - ₹13,00,000",
    skills: ["React", "JavaScript", "HTML", "CSS", "SQL"],
    requiredSkills: ["React", "JavaScript", "HTML", "CSS"],
    preferredSkills: ["TypeScript", "Next.js", "TailwindCSS"],
    description: "Craft seamless checkout flows and payment dashboard components for merchants across India."
  },
  {
    id: "job-18",
    title: "Associate Database Engineer",
    company: "Flipkart",
    location: "Bangalore, India",
    type: "hybrid",
    experience: 0,
    salary: "₹9,00,000 - ₹14,00,000",
    skills: ["SQL", "MongoDB", "PostgreSQL", "Database Design", "Java"],
    requiredSkills: ["SQL", "MongoDB", "Database Design"],
    preferredSkills: ["PostgreSQL", "Query Optimization", "Python"],
    description: "Manage high-scale relational and NoSQL databases handling peak Big Billion Day ecommerce query loads."
  },
  {
    id: "job-19",
    title: "Software Engineer - Applications",
    company: "Infosys",
    location: "Pune, India",
    type: "hybrid",
    experience: 0,
    salary: "₹6,00,000 - ₹9,00,000",
    skills: ["Java", "SQL", "React", "Git"],
    requiredSkills: ["Java", "SQL"],
    preferredSkills: ["React", "Spring", "Oracle"],
    description: "Develop enterprise web solutions and cloud-migrated applications for global Fortune 500 enterprise clients."
  },
  {
    id: "job-20",
    title: "Backend API Developer",
    company: "Zomato",
    location: "Gurgaon, India",
    type: "on-site",
    experience: 1,
    salary: "₹11,00,000 - ₹17,00,000",
    skills: ["Java", "Spring Boot", "Docker", "MongoDB", "SQL"],
    requiredSkills: ["Java", "Spring Boot", "SQL"],
    preferredSkills: ["Docker", "MongoDB", "Microservices"],
    description: "Build robust REST APIs handling hyper-local restaurant menu lookups and dynamic pricing calculation engines."
  }
];

// Robustness & Adaptation Fallback Dataset (Used when Primary Search Source triggers simulated failover)
const BACKUP_JOBS_DATASET = [
  {
    id: "backup-job-1",
    title: "Software Engineer (Backup Pool)",
    company: "Apex Global Cloud",
    location: "Bangalore, India",
    type: "hybrid",
    experience: 0,
    salary: "₹8,50,000 - ₹12,50,000",
    skills: ["Java", "SQL", "React", "MongoDB"],
    requiredSkills: ["Java", "SQL", "React"],
    preferredSkills: ["MongoDB", "Docker"],
    description: "Emergency cached job feed: Graduate level Software Engineering opening in cloud applications team."
  },
  {
    id: "backup-job-2",
    title: "Junior Java Engineer (Backup Pool)",
    company: "Nexus Financial",
    location: "Hyderabad, India",
    type: "remote",
    experience: 0,
    salary: "₹8,00,000 - ₹11,50,000",
    skills: ["Java", "SQL", "Spring Boot", "Git"],
    requiredSkills: ["Java", "SQL"],
    preferredSkills: ["Spring Boot", "Docker"],
    description: "Emergency cached job feed: Banking technology associate role with training and mentorship."
  },
  {
    id: "backup-job-3",
    title: "Full Stack Engineer (Backup Pool)",
    company: "Quantum Labs",
    location: "India / Remote",
    type: "remote",
    experience: 0,
    salary: "₹9,00,000 - ₹13,00,000",
    skills: ["React", "Java", "SQL", "MongoDB"],
    requiredSkills: ["React", "Java", "SQL"],
    preferredSkills: ["MongoDB", "AWS"],
    description: "Emergency cached job feed: Build customer facing web portals and data ingestion pipelines."
  }
];

const SATYAPRAKASH_PROFILE = {
  fullName: "Satyaprakash",
  targetRole: "Software Engineer",
  experience: 0,
  experienceLevel: "Fresher",
  location: "India",
  skills: ["Java", "React", "SQL", "MongoDB"],
  projects: [
    {
      name: "E-commerce Web Platform",
      description: "Full stack shopping portal with product catalog, cart, checkout, and MongoDB / SQL order persistence.",
      technologies: ["Java", "React", "SQL", "MongoDB"]
    },
    {
      name: "Finance Management App",
      description: "Interactive personal budgeting dashboard with transaction filtering and category analytics.",
      technologies: ["React", "Java", "SQL"]
    }
  ],
  education: "B.Tech in Computer Science & Engineering",
  certifications: ["Java Core Certified Developer", "Database Management Specialist"],
  resumeText: `Satyaprakash
Software Engineer (Fresher)
Location: India | Email: satyaprakash@example.com | Phone: +91 98765 43210

CAREER OBJECTIVE
Enthusiastic Fresher Computer Science Engineer looking for a Software Engineer role in India to build high-scale, reliable web and backend applications.

TECHNICAL SKILLS
- Languages: Java, SQL, JavaScript
- Frontend: React, HTML5, CSS3
- Databases: SQL, MongoDB, PostgreSQL
- Tools & Practices: Git, Agile, REST APIs

PROJECTS
1. E-commerce Web Platform
- Built end-to-end shopping application using React and Java backend.
- Managed user authentication, product catalog, and SQL order persistence.

2. Finance Management App
- Created personal finance expense tracker with React and MongoDB.
- Implemented real-time budget calculations and category-wise charts.

EDUCATION
B.Tech in Computer Science & Engineering (2022 - 2026)`
};

const DEFAULT_SEEKER_PROFILE = {
  fullName: "Alex Carter",
  title: "Frontend Engineer",
  experience: 3,
  location: "Remote",
  skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Git"],
  education: "B.S. in Computer Science, Stanford University",
  resumeText: "Alex Carter\nFrontend Engineer\nEmail: alex.carter@email.com\nPhone: (555) 123-4567\nLocation: Remote\n\nPROFESSIONAL SUMMARY\nDetail-oriented Frontend Developer with 3 years of experience specializing in building responsive React applications. Passionate about beautiful interfaces and accessibility.\n\nTECHNICAL SKILLS\n- Frontend: HTML, CSS, JavaScript, React, TypeScript\n- Tools: Git, Webpack, Figma\n\nEXPERIENCE\nFrontend Developer at DevCorp (2024 - Present)\n- Built user-facing dashboard interfaces in React.\n- Optimised page speed metrics by 25%.\n\nEDUCATION\nB.S. in Computer Science - Stanford University"
};

const DEFAULT_APPLICATIONS = [
  {
    id: "app-1",
    jobId: "job-1",
    seekerName: "Alex Carter",
    seekerTitle: "Frontend Engineer",
    status: "interview", /* applied, review, interview, offer, rejected */
    appliedDate: "2026-08-10",
    matchingScore: 92,
    interviewDate: "2026-08-18T10:00:00"
  },
  {
    id: "app-2",
    jobId: "job-4",
    seekerName: "Alex Carter",
    seekerTitle: "Frontend Engineer",
    status: "review",
    appliedDate: "2026-08-12",
    matchingScore: 78
  },
  {
    id: "app-3",
    jobId: "job-5",
    seekerName: "Alex Carter",
    seekerTitle: "Frontend Engineer",
    status: "applied",
    appliedDate: "2026-08-14",
    matchingScore: 88
  }
];

const DEFAULT_CANDIDATES = [
  {
    fullName: "Sarah Jenkins",
    title: "Backend Architect",
    experience: 8,
    location: "Austin, TX",
    skills: ["Node.js", "Express", "PostgreSQL", "System Design", "AWS", "Git", "Redis"],
    education: "M.S. in Software Engineering, UT Austin",
    resumeText: "Sarah Jenkins\nSenior Backend Developer\nSkills: Node.js, Express, PostgreSQL, System Design, AWS, Git, Redis\nExperience: 8 years building scalable web services."
  },
  {
    fullName: "David Chen",
    title: "Data Scientist",
    experience: 5,
    location: "Los Gatos, CA",
    skills: ["Python", "SQL", "Pandas", "Scikit-Learn", "Machine Learning", "R"],
    education: "Ph.D. in Data Science, UC Berkeley",
    resumeText: "David Chen\nData Science Researcher\nSkills: Python, SQL, Pandas, Scikit-Learn, Machine Learning\nExperience: 5 years designing recommendation scoring engines."
  }
];

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_JOBS,
    BACKUP_JOBS_DATASET,
    SATYAPRAKASH_PROFILE,
    DEFAULT_SEEKER_PROFILE,
    DEFAULT_APPLICATIONS,
    DEFAULT_CANDIDATES
  };
}
