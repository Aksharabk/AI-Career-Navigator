const express = require("express");
const Router = express.Router();
const User = require("../models/User");

// =========================
// HELPER: ESCAPE REGEX
// =========================
function escapeRegex(text) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// =========================
// SHOW REGISTER / LOGIN PAGE (HOME)
// =========================
Router.get("/", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }

  res.render("register", {
    title: "AI-POWERED CAREER GUIDANCE AND EMPLOYABILITY ENHANCEMENT PLATFORM",
    loginError: "",
    registerError: "",
    successMessage: "",
    activeTab: "login",
    loginEmail: "",
    registerName: "",
    registerEmail: "",
    registerPhone: "",
    email: "",
    password: ""
  });
});

// Direct GET /login
Router.get("/login", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }

  res.render("register", {
    title: "Login | AI-POWERED CAREER GUIDANCE AND EMPLOYABILITY ENHANCEMENT PLATFORM",
    loginError: "",
    registerError: "",
    successMessage: "",
    activeTab: "login",
    loginEmail: "",
    registerName: "",
    registerEmail: "",
    registerPhone: "",
    email: "",
    password: ""
  });
});

// Direct GET /register
Router.get("/register", (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect("/dashboard");
  }

  res.render("register", {
    title: "Register | AI-POWERED CAREER GUIDANCE AND EMPLOYABILITY ENHANCEMENT PLATFORM",
    loginError: "",
    registerError: "",
    successMessage: "",
    activeTab: "register",
    loginEmail: "",
    registerName: "",
    registerEmail: "",
    registerPhone: "",
    email: "",
    password: ""
  });
});

// =========================
// HANDLE USER REGISTRATION
// =========================
Router.post("/register", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const phone = (req.body.phone || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();
    const cpassword = (req.body.cpassword || "").trim();

    // Check required fields
    if (!name || !email || !password || !cpassword) {
      return res.render("register", {
        title: "Register",
        loginError: "",
        registerError: "Please fill in all required fields.",
        successMessage: "",
        activeTab: "register",
        loginEmail: "",
        registerName: name,
        registerEmail: email,
        registerPhone: phone,
        email: "",
        password: "Please fill in all required fields."
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render("register", {
        title: "Register",
        loginError: "",
        registerError: "Please provide a valid email address.",
        successMessage: "",
        activeTab: "register",
        loginEmail: "",
        registerName: name,
        registerEmail: email,
        registerPhone: phone,
        email: "",
        password: "Please provide a valid email address."
      });
    }

    // Password length validation
    if (password.length < 4) {
      return res.render("register", {
        title: "Register",
        loginError: "",
        registerError: "Password must be at least 4 characters long.",
        successMessage: "",
        activeTab: "register",
        loginEmail: "",
        registerName: name,
        registerEmail: email,
        registerPhone: phone,
        email: "",
        password: "Password must be at least 4 characters."
      });
    }

    // Password match check
    if (password !== cpassword) {
      return res.render("register", {
        title: "Register",
        loginError: "",
        registerError: "Passwords do not match. Please re-enter.",
        successMessage: "",
        activeTab: "register",
        loginEmail: "",
        registerName: name,
        registerEmail: email,
        registerPhone: phone,
        email: "",
        password: "Passwords do not match."
      });
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") }
    });

    if (existingUser) {
      return res.render("register", {
        title: "Register",
        loginError: "",
        registerError: "This email is already registered. Please log in instead.",
        successMessage: "",
        activeTab: "register",
        loginEmail: email,
        registerName: name,
        registerEmail: email,
        registerPhone: phone,
        email: "",
        password: "Email already exists."
      });
    }

    // Save new user
    const userData = new User({
      name,
      phone,
      email,
      password
    });

    await userData.save();

    // Render login tab with success banner
    return res.render("register", {
      title: "Registration Successful",
      loginError: "",
      registerError: "",
      successMessage: "Account created successfully! You can now log in with your credentials.",
      activeTab: "login",
      loginEmail: email,
      registerName: "",
      registerEmail: "",
      registerPhone: "",
      email: "",
      password: ""
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.render("register", {
      title: "Register Error",
      loginError: "",
      registerError: "An unexpected error occurred during registration. Please try again.",
      successMessage: "",
      activeTab: "register",
      loginEmail: "",
      registerName: req.body.name || "",
      registerEmail: req.body.email || "",
      registerPhone: req.body.phone || "",
      email: "",
      password: "An error occurred."
    });
  }
});

// =========================
// HANDLE USER LOGIN
// =========================
Router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const password = (req.body.password || "").trim();

    if (!email || !password) {
      return res.render("register", {
        title: "Login",
        loginError: "Please enter both email and password.",
        registerError: "",
        successMessage: "",
        activeTab: "login",
        loginEmail: email,
        registerName: "",
        registerEmail: "",
        registerPhone: "",
        email: "Please enter both email and password.",
        password: ""
      });
    }

    // Case-insensitive email search
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") }
    });

    if (!user || user.password !== password) {
      return res.render("register", {
        title: "Login",
        loginError: "Invalid email or password. Please check your credentials.",
        registerError: "",
        successMessage: "",
        activeTab: "login",
        loginEmail: email,
        registerName: "",
        registerEmail: "",
        registerPhone: "",
        email: "Invalid email or password",
        password: ""
      });
    }

    // Save user ID and name in session
    req.session.userId = user._id;
    req.session.userName = user.name;

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save error:", saveErr);
      }
      return res.redirect("/dashboard");
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.render("register", {
      title: "Login",
      loginError: "An unexpected error occurred during login. Please try again.",
      registerError: "",
      successMessage: "",
      activeTab: "login",
      loginEmail: req.body.email || "",
      registerName: "",
      registerEmail: "",
      registerPhone: "",
      email: "Login failed",
      password: ""
    });
  }
});

// =========================
// LOGOUT
// =========================
Router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

// =========================
// IQ TEST PAGE
// =========================
Router.get("/iq", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  res.render("iq");
});

module.exports = Router;
