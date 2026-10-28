from flask import Flask, request, render_template
import pandas as pd
import os

app = Flask(__name__)

# ======================
# LOAD DATASET
# ======================
df = pd.read_csv("skills.csv")

# ======================
# CLEAN SKILLS
# ======================
def clean_skills(text):
    if pd.isna(text):
        return []
    return [s.strip().lower() for s in str(text).split(",") if s.strip() != ""]

# ======================
# MATCH SCORE
# ======================
def calculate_match(user_skills, career_skills):
    match = len(set(user_skills) & set(career_skills))
    total = len(career_skills)

    if total == 0:
        return 0

    return int((match / total) * 100)

# ======================
# ROADMAP
# ======================
def generate_roadmap(career):
    roadmap_map = {
        "Software Developer": [
            "Learn DSA (Arrays, Trees)",
            "Practice coding (LeetCode)",
            "Learn Spring Boot",
            "Build 2 projects",
            "Prepare interviews"
        ],
        "Data Analyst": [
            "Learn Python & Pandas",
            "Learn SQL",
            "Learn Power BI",
            "Work on datasets"
        ],
        "Web Developer": [
            "HTML, CSS",
            "JavaScript",
            "React",
            "Build websites"
        ],
        "Full Stack Developer": [
            "Frontend + Backend",
            "Node.js",
            "MongoDB",
            "Projects"
        ]
    }
    return roadmap_map.get(career, ["Learn basics", "Practice", "Build projects"])

# ======================
# REASONS
# ======================
def generate_reasons(user_skills, career_skills):
    matched = list(set(user_skills) & set(career_skills))
    if not matched:
        return ["General skill match"]
    return [f"Strong in {skill}" for skill in matched[:3]]

# ======================
# HOME
# ======================
@app.route('/')
def home():
    return render_template("index.html")

# ======================
# RECOMMEND
# ======================
@app.route('/recommend', methods=['POST'])
def recommend():

    user_input = request.form.get("skills", "")
    user_skills = clean_skills(user_input)

    results = []

    for _, row in df.iterrows():
        career_skills = clean_skills(row.get("Skills", ""))

        if len(career_skills) == 0:
            continue

        score = calculate_match(user_skills, career_skills)

        if score > 20:
            missing = list(set(career_skills) - set(user_skills))

            results.append({
                "career": row.get("Recommended Career", "Unknown"),
                "confidence": score,
                "missing_skills": missing,
                "roadmap": generate_roadmap(row.get("Recommended Career", "")),
                "reasons": generate_reasons(user_skills, career_skills)
            })

    results = sorted(results, key=lambda x: x["confidence"], reverse=True)[:3]

    if not results:
        results = [{
            "career": "No strong match",
            "confidence": 0,
            "missing_skills": ["Improve skills"],
            "roadmap": ["Learn basics"],
            "reasons": ["Low matching"]
        }]

    return render_template("results.html", results=results)


# ======================
# RUN
# ======================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)