const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');

// Configure Multer for in-memory file uploads (max 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|docx|doc)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and DOC/DOCX files are supported!'));
    }
  }
});

// Helper to extract text from file buffer
async function extractTextFromBuffer(buffer, mimetype, originalname) {
  const isPdf = mimetype === 'application/pdf' || (originalname && originalname.toLowerCase().endsWith('.pdf'));

  if (isPdf) {
    try {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      if (result && result.text && result.text.trim().length > 20) {
        return result.text;
      }
    } catch (pdfErr) {
      console.warn('PDFParse primary extraction error, attempting fallback:', pdfErr.message);
    }

    // Secondary fallback: regex/string extraction from PDF buffer
    try {
      const raw = buffer.toString('binary');
      const textMatches = raw.match(/\(([^()]+)\)T[jJ]/g);
      if (textMatches && textMatches.length > 5) {
        return textMatches.map(m => m.replace(/^[\\(]|T[jJ]$/g, '').trim()).join(' ');
      }
    } catch (e) {
      console.warn('Secondary PDF fallback error:', e.message);
    }
  }

  // Plain text fallback (for .txt or utf-8 strings)
  return buffer.toString('utf-8');
}

// ========================================================
// DOMAIN KEYWORDS & ATS CRITERIA KNOWLEDGE BASE
// ========================================================
const DOMAIN_CRITERIA = {
  fullstack: {
    title: 'Full Stack Developer',
    coreKeywords: [
      'react', 'node.js', 'javascript', 'typescript', 'express', 'mongodb',
      'postgresql', 'sql', 'rest api', 'git', 'docker', 'html5', 'css3',
      'redux', 'next.js', 'graphql', 'ci/cd', 'aws', 'system design',
      'microservices', 'unit testing', 'jest', 'tailwind'
    ],
    recommendedCertifications: [
      'Meta Full-Stack Developer Certificate',
      'AWS Certified Developer - Associate',
      'Node.js Application Developer (JSNAD)'
    ],
    sampleBullets: [
      'Architected and deployed responsive Full Stack web applications using React, Node.js, and PostgreSQL, reducing page latency by 35%.',
      'Engineered secure RESTful APIs with JWT authentication and rate limiting, handling 25,000+ daily requests with 99.9% uptime.',
      'Automated CI/CD pipelines using GitHub Actions and Docker, reducing production deployment time by 45%.'
    ]
  },
  frontend: {
    title: 'Frontend Developer',
    coreKeywords: [
      'react', 'javascript', 'typescript', 'html5', 'css3', 'tailwind css',
      'vue', 'angular', 'redux', 'next.js', 'responsive design', 'webpack',
      'vite', 'rest api', 'accessibility', 'a11y', 'performance optimization',
      'ui/ux', 'git', 'jest', 'storybook'
    ],
    recommendedCertifications: [
      'Meta Front-End Developer Professional Certificate',
      'W3Cx Front-End Web Developer',
      'Certified Web Accessibility Specialist'
    ],
    sampleBullets: [
      'Engineered mobile-first component library with React and Tailwind CSS, increasing page load speed by 40% across 50k+ monthly active users.',
      'Refactored legacy single-page application into Next.js with Server-Side Rendering (SSR), improving SEO rankings and Core Web Vitals score to 95+.',
      'Implemented automated end-to-end component testing with Cypress and Jest, achieving 90% test coverage.'
    ]
  },
  backend: {
    title: 'Backend Developer',
    coreKeywords: [
      'node.js', 'express', 'python', 'django', 'fastapi', 'java', 'spring boot',
      'postgresql', 'mongodb', 'mysql', 'redis', 'rest api', 'graphql',
      'microservices', 'docker', 'kubernetes', 'aws', 'kafka', 'jwt',
      'system design', 'database optimization', 'ci/cd', 'linux'
    ],
    recommendedCertifications: [
      'Oracle Certified Professional: Java SE Developer',
      'AWS Certified Solutions Architect - Associate',
      'MongoDB Certified Developer Associate'
    ],
    sampleBullets: [
      'Engineered distributed backend microservices utilizing Node.js and Redis caching, decreasing database query overhead by 50%.',
      'Optimized SQL database schemas and indexing structures across 2M+ rows, slashing median response latency from 680ms to 95ms.',
      'Integrated resilient OAuth2/JWT authentication and role-based access control (RBAC), securing 10+ sensitive endpoint clusters.'
    ]
  },
  datascience: {
    title: 'Data Scientist & ML Engineer',
    coreKeywords: [
      'python', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
      'machine learning', 'deep learning', 'sql', 'data visualization',
      'nlp', 'statistics', 'exploratory data analysis', 'feature engineering',
      'matplotlib', 'seaborn', 'jupyter', 'model evaluation', 'big data', 'git'
    ],
    recommendedCertifications: [
      'TensorFlow Developer Certificate',
      'IBM Data Science Professional Certificate',
      'Google Cloud Certified Professional Data Engineer'
    ],
    sampleBullets: [
      'Designed and tuned end-to-end XGBoost and neural network predictive models achieving 92.4% ROC-AUC accuracy on real-world customer datasets.',
      'Orchestrated automated data pipelines using Pandas and SQL to ingest and clean 500k+ weekly transactions with zero downtime.',
      'Deployed machine learning inference APIs using FastAPI and Docker, serving real-time predictions in under 45ms.'
    ]
  },
  dataanalytics: {
    title: 'Data Analyst & BI Specialist',
    coreKeywords: [
      'sql', 'python', 'excel', 'power bi', 'tableau', 'data cleaning',
      'data modeling', 'etl', 'statistical analysis', 'dashboards',
      'reporting', 'kpis', 'business intelligence', 'data warehousing',
      'postgresql', 'data visualization', 'metrics'
    ],
    recommendedCertifications: [
      'Google Data Analytics Professional Certificate',
      'Microsoft Certified: Power BI Data Analyst Associate',
      'Tableau Desktop Specialist'
    ],
    sampleBullets: [
      'Constructed dynamic executive Power BI dashboards tracking 15+ KPIs, empowering department leads to identify $120k in operational cost savings.',
      'Executed complex SQL queries (Window functions, CTEs, Joins) across multi-million row databases to perform churn analysis.',
      'Streamlined monthly financial reporting workflows using Python and Excel VBA, eliminating 12 hours of manual reconciliation per week.'
    ]
  },
  devops: {
    title: 'DevOps & Cloud Engineer',
    coreKeywords: [
      'aws', 'azure', 'docker', 'kubernetes', 'ci/cd', 'terraform',
      'jenkins', 'github actions', 'linux', 'bash', 'ansible',
      'prometheus', 'grafana', 'infrastructure as code', 'git',
      'helm', 'microservices', 'monitoring', 'networking'
    ],
    recommendedCertifications: [
      'AWS Certified DevOps Engineer - Professional',
      'Certified Kubernetes Administrator (CKA)',
      'HashiCorp Certified: Terraform Associate'
    ],
    sampleBullets: [
      'Configured automated CI/CD deployment pipelines using GitHub Actions and Helm, cutting release failure rate by 60%.',
      'Provisioned high-availability multi-region cloud infrastructure using Terraform (IaC) and Kubernetes on AWS EKS.',
      'Built centralized observability and alerting with Prometheus and Grafana dashboards, decreasing MTTR (Mean Time to Resolution) by 40%.'
    ]
  },
  cybersecurity: {
    title: 'Cybersecurity Analyst',
    coreKeywords: [
      'network security', 'penetration testing', 'vulnerability assessment',
      'siem', 'firewalls', 'incident response', 'cryptography', 'linux',
      'wireshark', 'threat intelligence', 'soc', 'owasp', 'compliance',
      'nist', 'iso 27001', 'ethical hacking', 'identity and access management'
    ],
    recommendedCertifications: [
      'CompTIA Security+',
      'Certified Ethical Hacker (CEH)',
      'Certified Information Systems Security Professional (CISSP)'
    ],
    sampleBullets: [
      'Conducted vulnerability assessments and penetration testing using Wireshark and Burp Suite across 40+ web applications, mitigating 18 critical flaws.',
      'Managed SIEM telemetry and incident response protocols, monitoring 10,000+ daily log events with 99.8% threat mitigation success rate.',
      'Audited company infrastructure against OWASP Top 10 vulnerabilities, improving overall security compliance to 100% standard.'
    ]
  },
  mobile: {
    title: 'Mobile App Developer',
    coreKeywords: [
      'flutter', 'react native', 'dart', 'swift', 'kotlin', 'ios',
      'android', 'mobile ui', 'state management', 'rest api', 'firebase',
      'sqlite', 'app store', 'google play', 'push notifications', 'git'
    ],
    recommendedCertifications: [
      'Meta Android Developer Professional Certificate',
      'Meta iOS Developer Professional Certificate',
      'Associate Android Developer by Google'
    ],
    sampleBullets: [
      'Developed and published high-performance cross-platform Flutter mobile applications on Google Play Store with 4.8-star user rating.',
      'Integrated Firebase real-time database, cloud messaging, and push notifications, elevating user daily active engagement by 35%.',
      'Implemented clean Bloc/Redux architecture and offline-first caching, ensuring smooth 60fps animations and sub-second load times.'
    ]
  },
  uiux: {
    title: 'UI/UX Designer',
    coreKeywords: [
      'figma', 'adobe xd', 'wireframing', 'prototyping', 'user research',
      'usability testing', 'design systems', 'information architecture',
      'interaction design', 'user personas', 'user journey mapping',
      'responsive design', 'heuristic evaluation', 'visual design'
    ],
    recommendedCertifications: [
      'Google UX Design Professional Certificate',
      'Nielsen Norman Group UX Master Certified',
      'Interaction Design Foundation (IxDF) Certified'
    ],
    sampleBullets: [
      'Designed end-to-end design systems in Figma encompassing 200+ modular components and tokens, accelerating development sprint velocities by 30%.',
      'Spearheaded user research and moderated usability testing across 25+ participants, boosting conversion funnel completion rate by 22%.',
      'Crafted high-fidelity interactive prototypes simulating micro-interactions, securing stakeholder sign-off across 3 enterprise product lines.'
    ]
  },
  product: {
    title: 'Product Manager',
    coreKeywords: [
      'product strategy', 'agile', 'scrum', 'roadmap', 'user stories',
      'market research', 'kpis', 'a/b testing', 'stakeholder management',
      'jira', 'prioritization', 'product lifecycle', 'user experience',
      'metrics', 'cross-functional leadership', 'go-to-market'
    ],
    recommendedCertifications: [
      'Certified Scrum Product Owner (CSPO)',
      'Product School Product Manager Certificate (PMC)',
      'Pragmatic Institute Certified'
    ],
    sampleBullets: [
      'Directed cross-functional agile development team of 10 engineers and designers to launch flagship SaaS features, generating $250k ARR in Q2.',
      'Authored comprehensive PRDs and user story backlogs in JIRA, consistently achieving 95% on-time sprint goal completions.',
      'Formulated A/B testing hypotheses analyzing user churn, resulting in an 18% improvement in customer retention metrics.'
    ]
  },
  general: {
    title: 'Software Engineer',
    coreKeywords: [
      'data structures', 'algorithms', 'object-oriented programming',
      'git', 'problem solving', 'python', 'java', 'javascript', 'sql',
      'system architecture', 'debugging', 'unit testing', 'agile',
      'code review', 'clean code', 'design patterns', 'rest api'
    ],
    recommendedCertifications: [
      'AWS Certified Cloud Practitioner',
      'GitHub Foundations Certification',
      'FreeCodeCamp Full Stack Developer'
    ],
    sampleBullets: [
      'Architected modular software solutions leveraging clean object-oriented design patterns, enhancing maintainability and reducing tech debt.',
      'Developed automated unit and integration test suites, increasing overall code reliability and deployment confidence to 94%.',
      'Collaborated in agile sprint cycles using Git and JIRA to deliver customer-facing software releases on bi-weekly cadences.'
    ]
  }
};

// Power action verbs for impact detection
const ACTION_VERBS = [
  'architected', 'engineered', 'developed', 'implemented', 'optimized',
  'spearheaded', 'orchestrated', 'automated', 'deployed', 'designed',
  'reduced', 'increased', 'accelerated', 'launched', 'transformed',
  'streamlined', 'built', 'programmed', 'managed', 'led', 'analyzed',
  'scaled', 'secured', 'integrated', 'refactored', 'formulated', 'delivered'
];

// Helper to calculate deep ATS Score and Recommendations
function analyzeResumeText(rawText, targetRoleKey, customJobDesc) {
  const text = (rawText || '').trim();
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Selected Domain Profile
  const profile = DOMAIN_CRITERIA[targetRoleKey] || DOMAIN_CRITERIA.general;
  let targetKeywords = [...profile.coreKeywords];

  // If user passed a custom job description, extract additional keywords
  if (customJobDesc && customJobDesc.trim().length > 10) {
    const jdWords = customJobDesc.toLowerCase()
      .replace(/[^a-z0-9+#\.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    const uniqueJdKeywords = Array.from(new Set(jdWords)).slice(0, 15);
    targetKeywords = Array.from(new Set([...targetKeywords, ...uniqueJdKeywords]));
  }

  // 1. Keyword Matching (40% weight)
  const foundKeywords = [];
  const missingKeywords = [];

  targetKeywords.forEach(kw => {
    // Regex boundary match or substring for tech terms
    const cleanKw = kw.trim().toLowerCase();
    const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9+#])${escaped}([^a-zA-Z0-9+#]|$)`, 'i');

    if (regex.test(lowerText) || lowerText.includes(cleanKw)) {
      foundKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const keywordRatio = targetKeywords.length > 0 ? foundKeywords.length / targetKeywords.length : 0.5;
  const keywordScore = Math.min(Math.round(keywordRatio * 100), 100);

  // 2. Standard Section Completeness (20% weight)
  const sections = {
    contactInfo: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|linkedin\.com|github\.com)/i.test(text),
    summary: /(summary|profile|about me|objective|professional summary)/i.test(text),
    experience: /(experience|employment|work history|professional experience|projects)/i.test(text),
    skills: /(skills|technical skills|technologies|tools|competencies)/i.test(text),
    education: /(education|academic|degree|university|college|b\.tech|bachelor|master|b\.s|m\.s)/i.test(text),
    certifications: /(certifications?|licenses?|achievements?|awards?|credentials?)/i.test(text)
  };

  let sectionScoreCount = 0;
  if (sections.contactInfo) sectionScoreCount += 25;
  if (sections.experience) sectionScoreCount += 25;
  if (sections.skills) sectionScoreCount += 20;
  if (sections.education) sectionScoreCount += 15;
  if (sections.summary) sectionScoreCount += 10;
  if (sections.certifications) sectionScoreCount += 5;
  const sectionScore = Math.min(sectionScoreCount, 100);

  // 3. Impact & Quantifiable Metrics (20% weight)
  const detectedActionVerbs = ACTION_VERBS.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(lowerText));
  const hasMetrics = /(\d+%\b|\d+k\b|\$\d+|\d+\+|\b\d+\s*(users|clients|projects|features|ms|seconds|hours))/i.test(text);
  const metricMatches = (text.match(/(\d+%\b|\d+k\b|\$\d+|\d+\+)/g) || []).length;

  let impactScore = 20; // baseline
  impactScore += Math.min(detectedActionVerbs.length * 6, 40);
  impactScore += Math.min(metricMatches * 8, 40);
  impactScore = Math.min(impactScore, 100);

  // 4. Formatting, Word Count & Readability (20% weight)
  let formattingScore = 50;
  if (wordCount >= 250 && wordCount <= 1200) {
    formattingScore += 30; // optimal resume length
  } else if (wordCount > 100 && wordCount < 250) {
    formattingScore += 10;
  }
  if (text.includes('•') || text.includes('-') || text.includes('*')) {
    formattingScore += 20; // bullet points detected
  }
  formattingScore = Math.min(formattingScore, 100);

  // Overall ATS Score (Weighted Composite)
  const overallAtsScore = Math.round(
    keywordScore * 0.40 +
    sectionScore * 0.20 +
    impactScore * 0.20 +
    formattingScore * 0.20
  );

  // Generate Personalized Recommendations Based on Target Interest
  const recommendations = [];

  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 6).join(', ');
    recommendations.push(`Include critical missing domain keywords in your Skills or Experience sections: ${topMissing}.`);
  }

  if (!sections.contactInfo) {
    recommendations.push('Add clear contact information at the top (Email, Phone, LinkedIn profile, and GitHub/Portfolio URL).');
  }

  if (!sections.summary) {
    recommendations.push('Include a 3-4 sentence Professional Summary tailored specifically to your target career role.');
  }

  if (detectedActionVerbs.length < 5) {
    recommendations.push('Upgrade bullet points with dynamic power action verbs (e.g. "Architected", "Engineered", "Optimized", "Spearheaded").');
  }

  if (metricMatches < 3) {
    recommendations.push('Quantify your contributions with metrics using Google\'s X-Y-Z formula: "Accomplished [X], as measured by [Y], by doing [Z]" (e.g. "reduced latency by 35%", "scaled to 50k+ users").');
  }

  if (wordCount < 300) {
    recommendations.push('Your resume content is relatively brief. Elaborate on project deliverables, architecture, and responsibilities.');
  } else if (wordCount > 1000) {
    recommendations.push('Resume length exceeds optimal 1-2 page density. Consider streamlining older roles to preserve high ATS attention.');
  }

  // Recommended Certifications for this interest
  if (profile.recommendedCertifications) {
    recommendations.push(`Boost employability for ${profile.title} with recognized credentials: ${profile.recommendedCertifications.join(', ')}.`);
  }

  // Generate Tailored Professional Summary Suggestion
  const primarySkills = foundKeywords.slice(0, 4).join(', ') || 'modern software technologies';
  const targetRoleTitle = profile.title;
  const suggestedSummary = `Results-driven ${targetRoleTitle} with proven expertise in ${primarySkills}. Passionate about designing robust, scalable solutions and leveraging ${missingKeywords.slice(0, 3).join(', ') || 'modern engineering best practices'} to maximize performance and business impact. Proven track record of architecting user-centric applications, optimizing delivery workflows, and driving measurable engineering velocity.`;

  return {
    targetRole: profile.title,
    atsScore: overallAtsScore,
    wordCount,
    breakdown: {
      keywordScore,
      sectionScore,
      impactScore,
      formattingScore
    },
    sectionsDetected: sections,
    foundKeywords,
    missingKeywords,
    actionVerbsFound: detectedActionVerbs,
    recommendations,
    sampleBullets: profile.sampleBullets || [],
    suggestedSummary,
    recommendedCertifications: profile.recommendedCertifications || []
  };
}

// ========================================================
// 1. GET RESUME ANALYZER PAGE VIEW
// ========================================================
router.get('/resume-analyzer', async (req, res) => {
  let user = null;
  if (req.session && req.session.userId) {
    user = await User.findById(req.session.userId).lean();
  }

  res.render('resumeAnalyzer', {
    user: user,
    name: user ? user.name : 'Guest',
    isLoggedIn: !!(req.session && req.session.userId),
    domainKeys: Object.keys(DOMAIN_CRITERIA).map(key => ({
      key,
      title: DOMAIN_CRITERIA[key].title
    }))
  });
});

// ========================================================
// 2. POST /api/resume/analyze (Upload File or Paste Text)
// ========================================================
router.post('/api/resume/analyze', upload.single('resumeFile'), async (req, res) => {
  try {
    let resumeText = '';
    let fileName = 'Direct Input Resume';

    // 1. Check for file upload
    if (req.file) {
      fileName = req.file.originalname;
      resumeText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else if (req.body.resumeText && req.body.resumeText.trim().length > 0) {
      resumeText = req.body.resumeText.trim();
      fileName = 'Pasted Resume Text';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file (PDF/TXT/DOC) or paste your resume text!'
      });
    }

    if (!resumeText || resumeText.trim().length < 40) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract sufficient text from the resume. Please ensure the file is not empty or password protected.'
      });
    }

    const targetRoleKey = (req.body.targetRole || 'fullstack').toLowerCase();
    const customJobDesc = req.body.jobDescription || '';

    // 2. Perform deep ATS Analysis
    const analysis = analyzeResumeText(resumeText, targetRoleKey, customJobDesc);

    // 3. Save to MongoDB User Profile if authenticated
    let savedToProfile = false;
    if (req.session && req.session.userId) {
      try {
        const user = await User.findById(req.session.userId);
        if (user) {
          if (!Array.isArray(user.resumeAnalyses)) {
            user.resumeAnalyses = [];
          }
          user.resumeAnalyses.push({
            fileName: fileName,
            targetRole: analysis.targetRole,
            atsScore: analysis.atsScore,
            breakdown: analysis.breakdown,
            foundKeywords: analysis.foundKeywords,
            missingKeywords: analysis.missingKeywords,
            recommendations: analysis.recommendations,
            summarySuggestion: analysis.suggestedSummary,
            date: new Date()
          });
          await user.save();
          savedToProfile = true;
        }
      } catch (dbErr) {
        console.warn('Failed saving resume analysis to MongoDB:', dbErr.message);
      }
    }

    res.json({
      success: true,
      fileName,
      savedToProfile,
      analysis
    });
  } catch (error) {
    console.error('Error in /api/resume/analyze:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing your resume.'
    });
  }
});

// ========================================================
// 3. GET /api/resume/history (User's Past ATS Scans)
// ========================================================
router.get('/api/resume/history', async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to view your scan history.'
      });
    }

    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const history = (user.resumeAnalyses || []).slice().reverse();
    res.json({
      success: true,
      totalScans: history.length,
      history
    });
  } catch (err) {
    console.error('Error fetching resume history:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
