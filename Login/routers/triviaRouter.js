const express = require("express");
const router = express.Router();
const User = require("../models/User");

// HTML entity decoder helper
function decodeHTMLEntities(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&deg;/g, "°")
    .replace(/&plusmn;/g, "±")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö")
    .replace(/&auml;/g, "ä")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&hellip;/g, "…")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Fisher-Yates array shuffle
function shuffle(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Curated Career & Tech Question Bank (High Quality, Zero Network Dependency Fallback)
const CURATED_QUESTIONS = {
  "tech-cs": [
    {
      question: "Which of the following time complexities is the most optimal for searching in a balanced binary search tree?",
      correct: "O(log n)",
      incorrect: ["O(n)", "O(n log n)", "O(1)"],
      category: "Computer Science & IT"
    },
    {
      question: "In object-oriented programming, what principle allows a child class to provide a specific implementation of a method defined in its parent class?",
      correct: "Polymorphism",
      incorrect: ["Encapsulation", "Inheritance", "Abstraction"],
      category: "Computer Science & IT"
    },
    {
      question: "Which data structure follows the First-In, First-Out (FIFO) principle?",
      correct: "Queue",
      incorrect: ["Stack", "Tree", "Graph"],
      category: "Computer Science & IT"
    },
    {
      question: "Which layer of the OSI model is responsible for routing packets across network boundaries?",
      correct: "Network Layer",
      incorrect: ["Transport Layer", "Data Link Layer", "Session Layer"],
      category: "Computer Science & IT"
    },
    {
      question: "What does ACID stand for in the context of relational database transactions?",
      correct: "Atomicity, Consistency, Isolation, Durability",
      incorrect: [
        "Accuracy, Consistency, Integrity, Durability",
        "Atomicity, Concurrency, Isolation, Distribution",
        "Availability, Consistency, Integrity, Durability"
      ],
      category: "Computer Science & IT"
    },
    {
      question: "Which sorting algorithm has an average time complexity of O(n log n) and is commonly implemented using divide-and-conquer?",
      correct: "Merge Sort",
      incorrect: ["Bubble Sort", "Insertion Sort", "Selection Sort"],
      category: "Computer Science & IT"
    },
    {
      question: "What is the primary function of an Operating System kernel?",
      correct: "Managing hardware resources and CPU scheduling",
      incorrect: [
        "Rendering web page graphics",
        "Compiling source code into machine code",
        "Running antivirus scans"
      ],
      category: "Computer Science & IT"
    },
    {
      question: "What does the term 'deadlock' refer to in concurrent computing?",
      correct: "A situation where two or more processes are blocked indefinitely, each waiting on the other",
      incorrect: [
        "A computer system shutting down unexpectedly",
        "A memory leak causing slow responsiveness",
        "A corrupted storage drive partition"
      ],
      category: "Computer Science & IT"
    }
  ],
  "tech-web": [
    {
      question: "Which HTTP status code signifies that a requested resource was not found on the server?",
      correct: "404 Not Found",
      incorrect: ["200 OK", "500 Internal Server Error", "301 Moved Permanently"],
      category: "Web Development"
    },
    {
      question: "In modern JavaScript, what does 'async/await' primarily provide?",
      correct: "Syntactic sugar over Promises for cleaner asynchronous code",
      incorrect: [
        "Multi-threaded background execution",
        "Automatic memory garbage collection",
        "A replacement for DOM query selectors"
      ],
      category: "Web Development"
    },
    {
      question: "Which CSS property is used to create a flexible responsive grid layout?",
      correct: "display: grid",
      incorrect: ["float: left", "position: absolute", "overflow: hidden"],
      category: "Web Development"
    },
    {
      question: "What is the purpose of the CORS (Cross-Origin Resource Sharing) mechanism?",
      correct: "To allow or restrict resources requested from another domain outside the given origin",
      incorrect: [
        "To speed up database indexing",
        "To compress image assets on the CDN",
        "To compile TypeScript to JavaScript"
      ],
      category: "Web Development"
    },
    {
      question: "Which JavaScript array method creates a new array populated with the results of calling a provided function on every element?",
      correct: "map()",
      incorrect: ["filter()", "reduce()", "forEach()"],
      category: "Web Development"
    },
    {
      question: "In Node.js Express applications, what is middleware?",
      correct: "Functions that have access to the request object (req), response object (res), and the next middleware function",
      incorrect: [
        "A database driver for MongoDB",
        "A frontend templating compiler",
        "A CSS preprocessor plugin"
      ],
      category: "Web Development"
    },
    {
      question: "What does JWT stand for in web authentication?",
      correct: "JSON Web Token",
      incorrect: ["Java Web Technology", "Joint Web Transfer", "JavaScript Widget Toolkit"],
      category: "Web Development"
    },
    {
      question: "Which HTML5 element is used to specify self-contained content, such as a blog post or news story?",
      correct: "<article>",
      incorrect: ["<section>", "<div>", "<aside>"],
      category: "Web Development"
    }
  ],
  "tech-ai": [
    {
      question: "What is the primary difference between Supervised and Unsupervised Learning?",
      correct: "Supervised learning uses labeled training data, while unsupervised learning uses unlabeled data",
      incorrect: [
        "Supervised learning requires GPU acceleration, unsupervised does not",
        "Supervised learning is only used for image classification",
        "Unsupervised learning always produces higher accuracy"
      ],
      category: "Data Science & AI"
    },
    {
      question: "Which Python library is the standard foundation for multidimensional array manipulation and numerical computing?",
      correct: "NumPy",
      incorrect: ["Flask", "BeautifulSoup", "Requests"],
      category: "Data Science & AI"
    },
    {
      question: "What does 'Overfitting' mean in machine learning?",
      correct: "When a model learns training data noise too closely and performs poorly on unseen test data",
      incorrect: [
        "When a model is too simple to capture trends in the data",
        "When training requires more RAM than available",
        "When the dataset contains missing values"
      ],
      category: "Data Science & AI"
    },
    {
      question: "In natural language processing (NLP), what architecture is the foundation of models like BERT and GPT?",
      correct: "Transformer",
      incorrect: ["Random Forest", "Support Vector Machine", "K-Means"],
      category: "Data Science & AI"
    },
    {
      question: "Which metric is commonly used to evaluate classification performance when classes are heavily imbalanced?",
      correct: "F1-Score",
      incorrect: ["Accuracy", "Mean Squared Error", "R-Squared"],
      category: "Data Science & AI"
    },
    {
      question: "What is gradient descent in the context of training machine learning models?",
      correct: "An optimization algorithm used to minimize the cost or loss function",
      incorrect: [
        "A method for data normalization",
        "A technique for web scraping training corpora",
        "A hardware acceleration instruction set"
      ],
      category: "Data Science & AI"
    }
  ],
  "aptitude-logic": [
    {
      question: "Find the next number in the sequence: 2, 6, 12, 20, 30, ?",
      correct: "42",
      incorrect: ["40", "44", "48"],
      category: "Aptitude & Logical Reasoning"
    },
    {
      question: "If a car travels 120 kilometers in 2 hours, what is its average speed in meters per second?",
      correct: "16.67 m/s",
      incorrect: ["20 m/s", "12 m/s", "25 m/s"],
      category: "Aptitude & Logical Reasoning"
    },
    {
      question: "A product originally priced at $200 is discounted by 20%, and then taxed by 10%. What is the final price?",
      correct: "$176",
      incorrect: ["$180", "$170", "$184"],
      category: "Aptitude & Logical Reasoning"
    },
    {
      question: "If all Bloops are Razzies and all Razzies are Lizzies, are all Bloops definitely Lizzies?",
      correct: "Yes, definitely",
      incorrect: ["No, never", "Cannot be determined", "Only some Bloops"],
      category: "Aptitude & Logical Reasoning"
    },
    {
      question: "In a class of 50 students, 30 like Math, 25 like Science, and 10 like both. How many like neither?",
      correct: "5",
      incorrect: ["10", "15", "0"],
      category: "Aptitude & Logical Reasoning"
    }
  ]
};

// Built-in categories list
const CUSTOM_CATEGORIES = [
  { id: "tech-cs", name: "Computer Science & IT (Career Focus)" },
  { id: "tech-web", name: "Web Development & JavaScript" },
  { id: "tech-ai", name: "Data Science & Artificial Intelligence" },
  { id: "aptitude-logic", name: "Aptitude & Logical Reasoning" },
  { id: "18", name: "Science: Computers (OpenTDB)" },
  { id: "19", name: "Science: Mathematics (OpenTDB)" },
  { id: "9", name: "General Knowledge (OpenTDB)" },
  { id: "21", name: "Sports (OpenTDB)" },
  { id: "23", name: "History (OpenTDB)" },
  { id: "22", name: "Geography (OpenTDB)" },
  { id: "17", name: "Science & Nature (OpenTDB)" }
];

// ==========================================
// 1. GET CATEGORIES
// ==========================================
router.get("/categories", async (req, res) => {
  try {
    let openTdbCategories = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch("https://opentdb.com/api_category.php", {
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.trivia_categories)) {
          openTdbCategories = data.trivia_categories;
        }
      }
    } catch (netErr) {
      console.log("ℹ️ OpenTDB categories unreachable, using fallback categories:", netErr.message);
    }

    // Merge: custom tech tracks first, then OpenTDB categories
    const categoryMap = new Map();

    // Add our curated priority categories
    CUSTOM_CATEGORIES.forEach(c => categoryMap.set(String(c.id), c));

    // Append additional OpenTDB categories if available
    openTdbCategories.forEach(c => {
      const idStr = String(c.id);
      if (!categoryMap.has(idStr)) {
        categoryMap.set(idStr, { id: idStr, name: c.name });
      }
    });

    const finalCategories = Array.from(categoryMap.values());
    res.json({ success: true, categories: finalCategories });
  } catch (error) {
    console.error("Error in /categories:", error);
    res.json({ success: true, categories: CUSTOM_CATEGORIES });
  }
});

// ==========================================
// 2. GET QUESTIONS
// ==========================================
router.get("/questions", async (req, res) => {
  try {
    const category = req.query.category || "tech-cs";
    const amount = Math.min(Math.max(parseInt(req.query.amount, 10) || 10, 1), 30);
    const difficulty = req.query.difficulty || "";

    // Check if user requested one of our curated tracks
    if (CURATED_QUESTIONS[category]) {
      const pool = CURATED_QUESTIONS[category];
      const selected = shuffle(pool).slice(0, amount);
      const formatted = selected.map((q, idx) => {
        const answers = shuffle([q.correct, ...q.incorrect]);
        return {
          id: `curated-${category}-${idx}-${Date.now()}`,
          question: q.question,
          correct: q.correct,
          answers: answers,
          category: q.category
        };
      });

      return res.json({
        success: true,
        source: "curated",
        category: CURATED_QUESTIONS[category][0]?.category || category,
        total: formatted.length,
        questions: formatted
      });
    }

    // Attempt to fetch from OpenTDB
    let questions = [];
    try {
      let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
      if (category && category !== "any" && !isNaN(Number(category))) {
        url += `&category=${category}`;
      }
      if (difficulty && ["easy", "medium", "hard"].includes(difficulty.toLowerCase())) {
        url += `&difficulty=${difficulty.toLowerCase()}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data.response_code === 0 && Array.isArray(data.results) && data.results.length > 0) {
          questions = data.results.map((q, idx) => {
            const decodedQuestion = decodeHTMLEntities(q.question);
            const decodedCorrect = decodeHTMLEntities(q.correct_answer);
            const decodedIncorrect = (q.incorrect_answers || []).map(decodeHTMLEntities);
            const allAnswers = shuffle([decodedCorrect, ...decodedIncorrect]);

            return {
              id: `opentdb-${idx}-${Date.now()}`,
              question: decodedQuestion,
              correct: decodedCorrect,
              answers: allAnswers,
              category: decodeHTMLEntities(q.category),
              difficulty: q.difficulty
            };
          });
        }
      }
    } catch (fetchErr) {
      console.log("ℹ️ OpenTDB questions fetch fallback:", fetchErr.message);
    }

    // Fallback if OpenTDB failed, rate limited (code 5), or returned no results
    if (questions.length === 0) {
      console.log("Using fallback question pool for category:", category);
      // Combine all curated questions
      const allPool = Object.values(CURATED_QUESTIONS).flat();
      const selected = shuffle(allPool).slice(0, amount);
      questions = selected.map((q, idx) => ({
        id: `fallback-${idx}-${Date.now()}`,
        question: q.question,
        correct: q.correct,
        answers: shuffle([q.correct, ...q.incorrect]),
        category: q.category
      }));
    }

    res.json({
      success: true,
      source: "opentdb",
      category: questions[0]?.category || "Trivia",
      total: questions.length,
      questions
    });
  } catch (error) {
    console.error("Error in /questions:", error);
    // Safe emergency response
    const emergencyPool = CURATED_QUESTIONS["tech-cs"];
    const emergency = emergencyPool.slice(0, 5).map((q, idx) => ({
      id: `emergency-${idx}`,
      question: q.question,
      correct: q.correct,
      answers: shuffle([q.correct, ...q.incorrect]),
      category: q.category
    }));
    res.json({
      success: true,
      source: "emergency",
      category: "Computer Science",
      total: emergency.length,
      questions: emergency
    });
  }
});

// ==========================================
// 3. SUBMIT SCORE & SAVE TO DATABASE
// ==========================================
router.post("/submit", async (req, res) => {
  try {
    const { category, score, total } = req.body;
    const numScore = Number(score) || 0;
    const numTotal = Number(total) || 1;
    const percentage = Math.round((numScore / numTotal) * 100);
    const categoryName = category || "General Trivia";

    const scoreRecord = {
      category: categoryName,
      score: numScore,
      total: numTotal,
      percentage: percentage,
      date: new Date()
    };

    // If user is logged in, save to MongoDB
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        if (!Array.isArray(user.quizScores)) {
          user.quizScores = [];
        }
        user.quizScores.push(scoreRecord);
        await user.save();

        return res.json({
          success: true,
          saved: true,
          message: "Score successfully saved to your profile!",
          user: user.name,
          scoreRecord,
          totalQuizzesTaken: user.quizScores.length
        });
      }
    }

    // Guest submission
    res.json({
      success: true,
      saved: false,
      message: "Score calculated successfully. Log in to permanently record scores to your profile!",
      scoreRecord
    });
  } catch (error) {
    console.error("Error in /submit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record score on server",
      error: error.message
    });
  }
});

// ==========================================
// 4. USER SCORE HISTORY
// ==========================================
router.get("/history", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view quiz history"
      });
    }

    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const history = (user.quizScores || []).slice().reverse();
    const totalQuizzes = history.length;
    const avgScore = totalQuizzes > 0
      ? Math.round(history.reduce((acc, curr) => acc + curr.percentage, 0) / totalQuizzes)
      : 0;

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      stats: {
        totalQuizzes,
        avgScore
      },
      history
    });
  } catch (error) {
    console.error("Error in /history:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
