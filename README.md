# AI-POWERED CAREER GUIDANCE AND EMPLOYABILITY ENHANCEMENT PLATFORM

A comprehensive, AI-driven career guidance and employability platform featuring intelligent resume ATS scoring, dynamic career and aptitude quizzes, machine-learned career roadmap recommendations, and chatbot guidance.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Aksharabk/AI-Career-Navigator)

---

## 🌟 Key Features
- **AI Resume ATS Analyzer & Optimizer**: Upload PDF resumes, receive instant ATS scoring (0-100), extract matching/missing role keywords, and get tailored career enhancement recommendations.
- **Machine-Learned Career Matching**: Personalized career suggestions and custom roadmaps powered by Python Flask ML engine.
- **AI Trivia & Skill Assessments**: Dynamic assessments covering Computer Science, Web Development, Artificial Intelligence, and Aptitude with persistent score tracking.
- **Aptitude & IQ Testing**: Timed logical reasoning and aptitude tests with instant score computation.
- **Interactive Career Assistant**: Conversational AI assistant for guidance on career choices, roadmaps, and industry trends.

---

## 🚀 One-Click Cloud Deployment (Render)

This repository includes a pre-configured `render.yaml` Blueprint that deploys both services automatically:
1. **Python Flask Service**: Machine learning career recommendation engine.
2. **Node.js Express App**: Main web application with MongoDB Atlas integration.

### Deployment Steps:
1. Click the **[Deploy to Render](https://render.com/deploy?repo=https://github.com/Aksharabk/AI-Career-Navigator)** button above (or navigate to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)).
2. Connect your GitHub account and select repository `Aksharabk/AI-Career-Navigator`.
3. Render will automatically detect `render.yaml` and configure both web services.
4. Verify your `MONGO_URI` environment variable (pre-configured with MongoDB Atlas).
5. Click **Apply** to launch the deployment. Once built, your platform is live on the web!

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB (Local or Atlas)

### 2. Start Python Recommendation Service
```bash
cd recommandation
pip install -r requirements.txt
python app.py
```
*Runs on `http://127.0.0.1:5001`*

### 3. Start Node.js Express Platform
```bash
cd Login
npm install
npm start
```
*Runs on `http://localhost:4000`*
