const express = require("express");
const Router = express.Router();
const User = require("../models/User");

// =========================
// SHOW REGISTER / LOGIN PAGE
// =========================
Router.get("/", (req, res) => {
  res.render("register", {
    title: "Fill Form",
    password: "",
    email: ""
  });
});

// =========================
// HANDLE USER REGISTRATION
// =========================
Router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password, cpassword } = req.body;

    // Password match check
    if (password !== cpassword) {
      return res.render("register", {
        title: "",
        password: "Password not matching",
        email: ""
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", {
        title: "",
        password: "",
        email: "Email already exists. Please use a different one."
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

    res.render("register", {
      title: "Registration Successful",
      password: "",
      email: ""
    });

  } catch (error) {
    console.error(error);
    res.render("register", {
      title: "Error occurred",
      password: "",
      email: ""
    });
  }
});

// =========================
// HANDLE USER LOGIN
// =========================
Router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.render("register", {
        title: "",
        password: "",
        email: "Invalid email or password"
      });
    }

    // ✅ CRITICAL LINE (SESSION)
    req.session.userId = user._id;

    res.render("dashboard", { name: user.name });

  } catch (err) {
    console.error(err);
    res.render("register", {
      title: "",
      password: "",
      email: "Login failed"
    });
  }
});

// =========================
// LOGOUT
// =========================
Router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// =========================
// IQ TEST PAGE
// =========================
Router.get("/iq", (req, res) => {
  res.render("iq");
});

module.exports = Router;
