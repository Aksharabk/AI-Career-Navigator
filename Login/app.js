// ============================
// LOAD ENV VARIABLES
// ============================
require("dotenv").config();

// ============================
// IMPORTS
// ============================
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const User = require("./models/User");
const homeRouter = require("./routers/homeRouter");
const triviaRouter = require("./routers/triviaRouter");
const resumeRouter = require("./routers/resumeRouter");

// ============================
// APP INIT
// ============================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// CORS & HEADERS
// ============================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ============================
// MIDDLEWARE
// ============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "career_navigator_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Static
app.use(express.static(path.join(__dirname, "public")));
app.use("/trivia-app", express.static(path.join(__dirname, "../Trivia")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to inject recommendation URL dynamically
app.use((req, res, next) => {
  let recUrl = process.env.RECOMMENDATION_URL || "http://127.0.0.1:5001";
  if (!recUrl.startsWith("http://") && !recUrl.startsWith("https://")) {
    recUrl = "https://" + recUrl;
  }
  res.locals.recommendationUrl = recUrl;
  next();
});

// ============================
// 🔥 DATABASE CONNECTION (FIXED)
// ============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });

// ============================
// ROUTES
// ============================
app.use("/api/trivia", triviaRouter);
app.use("/", resumeRouter);
app.use("/", homeRouter);

// ============================
// DASHBOARD
// ============================
app.get("/dashboard", async (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      req.session.destroy();
      return res.redirect("/");
    }
    res.render("dashboard", { name: user.name });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.redirect("/");
  }
});

// ============================
// PROFILE
// ============================
app.get("/profile", async (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) {
      req.session.destroy();
      return res.redirect("/");
    }
    res.render("profile", { user });
  } catch (err) {
    console.error("Profile error:", err);
    res.redirect("/");
  }
});

// ============================
// EDIT PROFILE
// ============================
app.post("/edit-profile", async (req, res) => {
  if (!req.session.userId) return res.redirect("/");

  const { phone, age, gender, education } = req.body;

  await User.findByIdAndUpdate(req.session.userId, {
    phone,
    age,
    gender,
    education,
  });

  res.redirect("/profile");
});

// ============================
// CHATBOT
// ============================
app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "../chatbot/index.html"));
});

// ============================
// TEST PAGE
// ============================
app.get("/take-test", (req, res) => {
  if (!req.session.userId) return res.redirect("/");
  res.render("takeTest");
});

// ============================
// TRIVIA QUIZ
// ============================
app.get("/trivia", async (req, res) => {
  let user = null;
  if (req.session.userId) {
    user = await User.findById(req.session.userId).lean();
  }
  res.render("trivia", {
    user: user,
    name: user ? user.name : "Guest",
    isLoggedIn: !!req.session.userId
  });
});

// ============================
// SERVER START
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});