"""
Gemini AI service — wraps all prompt interactions with google-generativeai.
Each method returns structured Python data (dicts / lists) ready to store or
return as JSON.
"""
import json
import re
import google.generativeai as genai
from flask import current_app


def _get_model():
    genai.configure(api_key=current_app.config["GEMINI_API_KEY"])
    return genai.GenerativeModel("gemini-1.5-flash")


def _parse_json_response(text: str) -> dict | list:
    """Strip markdown fences then parse JSON."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("```").strip()
    return json.loads(cleaned)


# ── Summary ──────────────────────────────────────────────────────────────────

def generate_summary(text: str, subject: str = "", grade_level: str = "") -> dict:
    """Return a structured summary with key topics and takeaways."""
    model = _get_model()
    prompt = f"""
You are an expert educational content summarizer.
Subject: {subject or "General"}
Grade Level: {grade_level or "Not specified"}

Analyse the following document text and return a JSON object with these fields:
{{
  "overview": "2-3 sentence overview of the document",
  "keyTopics": ["topic1", "topic2", ...],
  "mainConcepts": [
    {{"concept": "name", "explanation": "brief explanation"}}, ...
  ],
  "learningObjectives": ["objective1", ...],
  "estimatedReadingTimeMinutes": <number>
}}

Document Text:
{text[:12000]}
"""
    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


# ── Quiz ─────────────────────────────────────────────────────────────────────

def generate_quiz(
    text: str,
    num_questions: int = 10,
    difficulty: str = "medium",
    subject: str = "",
) -> list[dict]:
    """Return a list of quiz question objects."""
    model = _get_model()
    prompt = f"""
You are an expert educator creating a quiz.
Subject: {subject or "General"}
Difficulty: {difficulty}
Number of questions: {num_questions}

Create a quiz from the document below. Return a JSON array where each element is:
{{
  "questionText": "...",
  "questionType": "multiple_choice" | "true_false",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A) ...",
  "explanation": "Why this is correct"
}}

Return ONLY the JSON array, no extra text.

Document Text:
{text[:12000]}
"""
    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


# ── Flashcards ────────────────────────────────────────────────────────────────

def generate_flashcards(
    text: str, num_cards: int = 15, subject: str = ""
) -> list[dict]:
    """Return a list of flashcard objects."""
    model = _get_model()
    prompt = f"""
You are an expert educator creating study flashcards.
Subject: {subject or "General"}
Number of flashcards: {num_cards}

Create flashcards from the key concepts in the document. Return a JSON array:
[
  {{
    "front": "Term or question",
    "back": "Definition or answer",
    "hint": "Optional memory hint (can be empty string)"
  }},
  ...
]

Return ONLY the JSON array.

Document Text:
{text[:12000]}
"""
    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


# ── Q&A ───────────────────────────────────────────────────────────────────────

def answer_question(text: str, question: str, conversation_history: list = None) -> str:
    """Answer a student question grounded in the document text."""
    model = _get_model()
    history_str = ""
    if conversation_history:
        for turn in conversation_history[-6:]:  # last 3 exchanges
            role = "Student" if turn["role"] == "user" else "Coach"
            history_str += f"{role}: {turn['content']}\n"

    prompt = f"""
You are a helpful AI learning coach for a school. Answer the student's question
based ONLY on the provided document content. If the answer is not in the document,
say so clearly. Be encouraging and age-appropriate.

Document Context:
{text[:10000]}

Conversation so far:
{history_str}

Student's Question: {question}

Provide a clear, helpful answer:
"""
    response = model.generate_content(prompt)
    return response.text.strip()


# ── Study Plan ────────────────────────────────────────────────────────────────

def generate_study_plan(
    text: str,
    duration_days: int = 7,
    goal: str = "",
    subject: str = "",
    grade_level: str = "",
) -> list[dict]:
    """Return a day-by-day study plan as a list of day objects."""
    model = _get_model()
    prompt = f"""
You are an expert educational planner.
Subject: {subject or "General"}
Grade Level: {grade_level or "Not specified"}
Study Duration: {duration_days} days
Student Goal: {goal or "Master the material"}

Create a detailed {duration_days}-day study plan based on the document.
Return a JSON array with one object per day:
[
  {{
    "day": 1,
    "title": "Day 1: Introduction to ...",
    "topics": ["topic1", "topic2"],
    "activities": [
      {{"type": "read", "description": "Read section on ..."}},
      {{"type": "practice", "description": "Complete exercises on ..."}},
      {{"type": "review", "description": "Review flashcards for ..."}}
    ],
    "estimatedMinutes": 45,
    "tips": "Study tip for today"
  }},
  ...
]

Return ONLY the JSON array.

Document Text:
{text[:12000]}
"""
    response = model.generate_content(prompt)
    return _parse_json_response(response.text)
