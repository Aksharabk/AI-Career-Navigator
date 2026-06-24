let questions = [];
let score = 0;
let totalQuestions = 10;
let currentIndex = 0;

const scoreEl = document.getElementById("score");
const qEl = document.getElementById("qs");
const quizApp = document.querySelector("#quiz-app");


// ✅ FETCH CATEGORIES
async function fetchCategories() {
    const res = await fetch("https://opentdb.com/api_category.php");
    const data = await res.json();
    return data.trivia_categories;
}

// ✅ LOAD CATEGORY DROPDOWN
async function chooseCategory() {
    const categories = await fetchCategories();
    const select = document.querySelector("#category-select");

    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}


// ✅ FETCH QUESTIONS
async function fetchTriviaQuestions() {
    const category = document.querySelector("#category-select").value;

    const res = await fetch(
        `https://opentdb.com/api.php?amount=${totalQuestions}&category=${category}&type=multiple`
    );

    const data = await res.json();

    // 🔥 SHUFFLE ANSWERS
    return data.results.map(q => {
        const allAnswers = [...q.incorrect_answers, q.correct_answer];
        return {
            question: q.question,
            correct: q.correct_answer,
            answers: shuffle(allAnswers)
        };
    });
}


// ✅ SHUFFLE FUNCTION
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


// ✅ DISPLAY QUESTION
function displayQuestion(qObj) {

    quizApp.innerHTML = `
    <div class="main-container">
        <div class="question">${qObj.question}</div>
        <div class="answers">
            ${qObj.answers.map(ans => `<div class="answer">${ans}</div>`).join("")}
        </div>
    </div>
    `;

    const answerBtns = document.querySelectorAll(".answer");

    answerBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            // prevent multiple clicks
            if (btn.classList.contains("clicked")) return;

            btn.classList.add("clicked");

            if (btn.innerText === qObj.correct) {
                btn.classList.add("correct");
                score++;
                scoreEl.textContent = score;
            } else {
                btn.classList.add("incorrect");

                // highlight correct answer
                answerBtns.forEach(b => {
                    if (b.innerText === qObj.correct) {
                        b.classList.add("correct");
                    }
                });
            }
        });
    });

    qEl.textContent = currentIndex + 1;
}


// ✅ START QUIZ
async function startQuiz() {
    score = 0;
    currentIndex = 0;
    scoreEl.textContent = 0;

    questions = await fetchTriviaQuestions();

    displayQuestion(questions[currentIndex]);
}


// ✅ NEXT BUTTON
document.getElementById("next-button").addEventListener("click", () => {
    currentIndex++;

    if (currentIndex >= questions.length) {
        showResult();
        return;
    }

    displayQuestion(questions[currentIndex]);
});


// ✅ PREVIOUS BUTTON
document.getElementById("prev-button").addEventListener("click", () => {
    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = 0;
        return;
    }

    displayQuestion(questions[currentIndex]);
});


// ✅ RESULT MODAL
function showResult() {
    const modal = document.getElementById("scoreModal");
    const scoreValue = document.getElementById("scoreValue");

    scoreValue.innerText = `Your Score: ${score} / ${questions.length}`;
    modal.style.display = "block";

    document.querySelector(".close").onclick = () => {
        modal.style.display = "none";
    };
}


// INIT
chooseCategory();

document.getElementById("start-quiz-button")
    .addEventListener("click", startQuiz);