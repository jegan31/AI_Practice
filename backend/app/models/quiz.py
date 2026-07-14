import json
from datetime import datetime, timezone
from app import db


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    difficulty = db.Column(
        db.Enum("easy", "medium", "hard", name="difficulty_level"), default="medium"
    )
    time_limit_minutes = db.Column(db.Integer, default=30)
    is_published = db.Column(db.Boolean, default=False)

    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=False)
    document = db.relationship("Document", back_populates="quizzes")
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    questions = db.relationship(
        "QuizQuestion", back_populates="quiz", lazy="joined", cascade="all, delete-orphan"
    )
    attempts = db.relationship("QuizAttempt", back_populates="quiz", lazy="dynamic")

    def to_dict(self, include_answers=False):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "timeLimitMinutes": self.time_limit_minutes,
            "isPublished": self.is_published,
            "documentId": self.document_id,
            "createdById": self.created_by_id,
            "questionCount": len(self.questions),
            "questions": [q.to_dict(include_answers=include_answers) for q in self.questions],
            "createdAt": self.created_at.isoformat(),
        }


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    quiz = db.relationship("Quiz", back_populates="questions")

    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(
        db.Enum("multiple_choice", "true_false", "short_answer", name="question_type"),
        default="multiple_choice",
    )
    # JSON array of option strings for MCQ; null for short_answer
    options = db.Column(db.Text)
    correct_answer = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self, include_answers=False):
        data = {
            "id": self.id,
            "questionText": self.question_text,
            "questionType": self.question_type,
            "options": json.loads(self.options) if self.options else [],
            "orderIndex": self.order_index,
        }
        if include_answers:
            data["correctAnswer"] = self.correct_answer
            data["explanation"] = self.explanation
        return data


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    quiz = db.relationship("Quiz", back_populates="attempts")
    student = db.relationship("User", back_populates="quiz_attempts")

    score = db.Column(db.Float)  # percentage 0-100
    answers = db.Column(db.Text)  # JSON: {question_id: answer}
    completed = db.Column(db.Boolean, default=False)
    time_taken_seconds = db.Column(db.Integer)

    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "quizId": self.quiz_id,
            "studentId": self.student_id,
            "score": self.score,
            "answers": json.loads(self.answers) if self.answers else {},
            "completed": self.completed,
            "timeTakenSeconds": self.time_taken_seconds,
            "startedAt": self.started_at.isoformat(),
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }
