// Backend API Base URL (defaults to Express server on port 4000)
const BACKEND_BASE = "http://localhost:4000";

let questions = [];
let score = 0;
let totalQuestions = 10;
let currentIndex = 0;
let selectedCategoryName = "General";
let userAnswers = {}; // Map of index -> { selected, isCorrect }
let isBackendOnline = false;

// DOM Elements
const scoreEl = document.getElementById("score");
const qEl = document.getElementById("qs");
const totalQsEl = document.getElementById("total-qs");
const progressBar = document.getElementById("progress-bar");
const categoryBadge = document.getElementById("category-badge");
const quizApp = document.querySelector("#quiz-app");
const categorySelect = document.querySelector("#category-select");
const countSelect = document.querySelector("#question-count-select");
const categorySection = document.getElementById("category-section");
const quizSection = document.getElementById("quiz-section");
const backendStatusBadge = document.getElementById("backendStatusBadge");
const nextButton = document.getElementById("next-button");
const prevButton = document.getElementById("prev-button");

// ✅ HTML ENTITY DECODER
function decodeEntities(text) {
  if (typeof text !== "string") return text;
  const parser = new DOMParser();
  const dom = parser.parseFromString(
    `<!doctype html><body>${text}`,
    "text/html"
  );
  return dom.body.textContent;
}

// ✅ SHUFFLE FUNCTION (Fisher-Yates)
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ✅ CHECK BACKEND STATUS
async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BACKEND_BASE}/api/trivia/categories`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      isBackendOnline = true;
      if (backendStatusBadge) {
        backendStatusBadge.className = "backend-badge connected";
        backendStatusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Backend Connected (Port 4000)</span>`;
      }
      return true;
    }
  } catch (err) {
    console.log("Backend offline or unreachable, using direct API mode:", err.message);
  }

  isBackendOnline = false;
  if (backendStatusBadge) {
    backendStatusBadge.className = "backend-badge offline";
    backendStatusBadge.innerHTML = `<i class="fa-solid fa-plug-circle-exclamation"></i> <span>Standalone Mode</span>`;
  }
  return false;
}

// ✅ LOAD CATEGORY DROPDOWN
async function chooseCategory() {
  await checkBackendStatus();

  let categories = [];

  // Try fetching from backend first
  if (isBackendOnline) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/trivia/categories`);
      const data = await res.json();
      if (data.categories && data.categories.length > 0) {
        categories = data.categories;
      }
    } catch (e) {
      console.warn("Failed fetching categories from backend:", e);
    }
  }

  // Fallback to OpenTDB if backend returned empty
  if (categories.length === 0) {
    try {
      const res = await fetch("https://opentdb.com/api_category.php");
      const data = await res.json();
      categories = data.trivia_categories || [];
    } catch (err) {
      console.warn("Direct OpenTDB categories fallback:", err);
      // Hardcoded offline categories
      categories = [
        { id: "tech-cs", name: "💻 Computer Science & IT" },
        { id: "tech-web", name: "🌐 Web Development" },
        { id: "tech-ai", name: "🤖 Data Science & AI" },
        { id: "aptitude-logic", name: "🧠 Aptitude & Reasoning" },
        { id: "18", name: "Science: Computers" },
        { id: "9", name: "General Knowledge" }
      ];
    }
  }

  // Populate dropdown
  if (categorySelect && categories.length > 0) {
    categorySelect.innerHTML = "";
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }
}

// ✅ FETCH QUESTIONS
async function fetchTriviaQuestions() {
  const category = categorySelect.value;
  totalQuestions = parseInt(countSelect.value, 10) || 10;
  selectedCategoryName = categorySelect.options[categorySelect.selectedIndex]?.text || "General";

  // 1. If backend is online, fetch through backend API
  if (isBackendOnline) {
    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/trivia/questions?category=${encodeURIComponent(category)}&amount=${totalQuestions}`
      );
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        return data.questions.map(q => ({
          question: q.question,
          correct: q.correct,
          answers: q.answers
        }));
      }
    } catch (err) {
      console.warn("Backend question fetch failed, falling back to direct API:", err);
    }
  }

  // 2. Direct OpenTDB call fallback
  try {
    let url = `https://opentdb.com/api.php?amount=${totalQuestions}&type=multiple`;
    if (category && !isNaN(Number(category))) {
      url += `&category=${category}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      return data.results.map(q => {
        const decodedCorrect = decodeEntities(q.correct_answer);
        const decodedIncorrect = (q.incorrect_answers || []).map(decodeEntities);
        const allAnswers = shuffle([decodedCorrect, ...decodedIncorrect]);

        return {
          question: decodeEntities(q.question),
          correct: decodedCorrect,
          answers: allAnswers
        };
      });
    }
  } catch (err) {
    console.warn("Direct OpenTDB failed, using built-in offline questions:", err);
  }

  // 3. Built-in Offline Fallback
  return [
    {
      question: "Which programming language was developed by Brendan Eich in 10 days in 1995?",
      correct: "JavaScript",
      answers: shuffle(["JavaScript", "Java", "Python", "C++"])
    },
    {
      question: "Which data structure follows the Last In, First Out (LIFO) order?",
      correct: "Stack",
      answers: shuffle(["Stack", "Queue", "Array", "Binary Tree"])
    },
    {
      question: "What does SQL stand for?",
      correct: "Structured Query Language",
      answers: shuffle(["Structured Query Language", "Sequential Question Logic", "Standard Quick Lookup", "System Query Link"])
    },
    {
      question: "Which HTTP method is typically used to create a new resource on a server?",
      correct: "POST",
      answers: shuffle(["POST", "GET", "PUT", "DELETE"])
    },
    {
      question: "In Python, which keyword is used to define an asynchronous function?",
      correct: "async def",
      answers: shuffle(["async def", "def async", "thread def", "future def"])
    }
  ];
}

// ✅ DISPLAY QUESTION
function displayQuestion(qObj) {
  if (!qObj) return;

  const currentAnswerState = userAnswers[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

  quizApp.innerHTML = `
    <div class="main-container">
      <div class="question">${qObj.question}</div>
      <div class="answers">
        ${qObj.answers
          .map(
            (ans, idx) => `
          <div class="answer" data-answer="${encodeURIComponent(ans)}">
            <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; background:#e2e8f0; border-radius:6px; font-size:12px; margin-right:10px; font-weight:bold;">
              ${optionLabels[idx] || "•"}
            </span>
            <span>${ans}</span>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;

  const answerBtns = document.querySelectorAll(".answer");

  // If question was already answered previously, restore states
  if (currentAnswerState) {
    answerBtns.forEach(btn => {
      btn.classList.add("clicked");
      const ansVal = decodeURIComponent(btn.getAttribute("data-answer"));

      if (ansVal === qObj.correct) {
        btn.classList.add("correct");
      }
      if (ansVal === currentAnswerState.selected && !currentAnswerState.isCorrect) {
        btn.classList.add("incorrect");
      }
    });
  } else {
    // Attach click listener for new answer
    answerBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        // Prevent double click
        if (userAnswers[currentIndex]) return;

        const selectedAnswer = decodeURIComponent(btn.getAttribute("data-answer"));
        const isCorrect = selectedAnswer.trim() === qObj.correct.trim();

        // Lock all buttons
        answerBtns.forEach(b => b.classList.add("clicked"));

        if (isCorrect) {
          btn.classList.add("correct");
          score++;
          scoreEl.textContent = score;
        } else {
          btn.classList.add("incorrect");
          // Reveal correct answer
          answerBtns.forEach(b => {
            const val = decodeURIComponent(b.getAttribute("data-answer"));
            if (val.trim() === qObj.correct.trim()) {
              b.classList.add("correct");
            }
          });
        }

        userAnswers[currentIndex] = {
          selected: selectedAnswer,
          isCorrect: isCorrect
        };
      });
    });
  }

  // Update counters and progress
  qEl.textContent = currentIndex + 1;
  totalQsEl.textContent = questions.length;
  if (categoryBadge) {
    categoryBadge.textContent = selectedCategoryName;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;

  // Update Next Button text if last question
  if (currentIndex === questions.length - 1) {
    nextButton.innerHTML = `Finish <i class="fa-solid fa-flag-checkered"></i>`;
  } else {
    nextButton.innerHTML = `Next <i class="fa-solid fa-arrow-right"></i>`;
  }
}

// ✅ START QUIZ
async function startQuiz() {
  score = 0;
  currentIndex = 0;
  userAnswers = {};
  scoreEl.textContent = 0;

  const startBtn = document.getElementById("start-quiz-button");
  startBtn.disabled = true;
  startBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading...`;

  questions = await fetchTriviaQuestions();

  startBtn.disabled = false;
  startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start Quiz`;

  if (categorySection) categorySection.style.display = "none";
  if (quizSection) quizSection.style.display = "block";

  displayQuestion(questions[currentIndex]);
}

// ✅ NEXT BUTTON
nextButton.addEventListener("click", () => {
  currentIndex++;

  if (currentIndex >= questions.length) {
    showResult();
    return;
  }

  displayQuestion(questions[currentIndex]);
});

// ✅ PREVIOUS BUTTON
prevButton.addEventListener("click", () => {
  currentIndex--;

  if (currentIndex < 0) {
    currentIndex = 0;
    return;
  }

  displayQuestion(questions[currentIndex]);
});

// ✅ RESULT MODAL & BACKEND SUBMISSION
async function showResult() {
  const modal = document.getElementById("scoreModal");
  const scoreValue = document.getElementById("scoreValue");
  const scoreFeedback = document.getElementById("scoreFeedback");
  const syncBanner = document.getElementById("modalBackendSync");

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  scoreValue.innerText = `Your Score: ${score} / ${total} (${percentage}%)`;

  if (percentage >= 80) {
    scoreFeedback.innerText = "🏆 Outstanding performance! Exceptional aptitude and knowledge.";
  } else if (percentage >= 50) {
    scoreFeedback.innerText = "🌟 Great job! Good foundation with clear growth potential.";
  } else {
    scoreFeedback.innerText = "🚀 Good effort! Keep practicing to elevate your skills.";
  }

  modal.style.display = "flex";

  // Post to backend API
  if (syncBanner) {
    syncBanner.style.display = "flex";
    syncBanner.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Saving score to MongoDB backend...</span>`;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/trivia/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: selectedCategoryName,
          score: score,
          total: total
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.saved) {
          syncBanner.className = "sync-banner";
          syncBanner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Score saved to user account in MongoDB!</span>`;
        } else {
          syncBanner.className = "sync-banner";
          syncBanner.innerHTML = `<i class="fa-solid fa-check"></i> <span>Quiz recorded (Login to sync to personal profile)</span>`;
        }
      } else {
        syncBanner.innerHTML = `<i class="fa-solid fa-cloud"></i> <span>Quiz completed</span>`;
      }
    } catch (err) {
      console.log("Could not reach backend to save score:", err.message);
      syncBanner.innerHTML = `<i class="fa-solid fa-info-circle"></i> <span>Completed locally (Backend offline)</span>`;
    }
  }

  document.querySelector(".close").onclick = () => {
    modal.style.display = "none";
  };
}

// Retry Button
const retryButton = document.getElementById("retry-button");
if (retryButton) {
  retryButton.onclick = () => {
    document.getElementById("scoreModal").style.display = "none";
    quizSection.style.display = "none";
    categorySection.style.display = "block";
  };
}

// INIT
chooseCategory();

document.getElementById("start-quiz-button").addEventListener("click", startQuiz);