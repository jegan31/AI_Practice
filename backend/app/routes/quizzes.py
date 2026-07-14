import json
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.utils.responses import success, error, paginated
from app.utils.auth import teacher_required, get_current_user

quizzes_bp = Blueprint("quizzes", __name__)


@quizzes_bp.get("/")
@jwt_required()
def list_quizzes():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 10, type=int)
    current_user = get_current_user()

    query = Quiz.query
    # Students only see published quizzes
    if current_user.role == "student":
        query = query.filter_by(is_published=True)

    total = query.count()
    quizzes = (
        query.order_by(Quiz.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return paginated(
        [q.to_dict(include_answers=(current_user.role == "teacher")) for q in quizzes],
        total, page, per_page,
    )


@quizzes_bp.get("/<int:quiz_id>")
@jwt_required()
def get_quiz(quiz_id):
    current_user = get_current_user()
    quiz = Quiz.query.get_or_404(quiz_id)
    include_answers = current_user.role == "teacher"
    return success(quiz.to_dict(include_answers=include_answers))


@quizzes_bp.put("/<int:quiz_id>/publish")
@jwt_required()
@teacher_required
def toggle_publish(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    quiz.is_published = not quiz.is_published
    db.session.commit()
    status = "published" if quiz.is_published else "unpublished"
    return success(quiz.to_dict(include_answers=True), f"Quiz {status}")


@quizzes_bp.post("/<int:quiz_id>/attempts")
@jwt_required()
def start_attempt(quiz_id):
    current_user = get_current_user()
    quiz = Quiz.query.get_or_404(quiz_id)

    if not quiz.is_published and current_user.role == "student":
        return error("This quiz is not available", 403)

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
    )
    db.session.add(attempt)
    db.session.commit()
    return success(attempt.to_dict(), "Attempt started", 201)


@quizzes_bp.put("/<int:quiz_id>/attempts/<int:attempt_id>/submit")
@jwt_required()
def submit_attempt(quiz_id, attempt_id):
    current_user = get_current_user()
    attempt = QuizAttempt.query.get_or_404(attempt_id)

    if attempt.student_id != current_user.id:
        return error("Forbidden", 403)
    if attempt.completed:
        return error("Attempt already submitted")

    data = request.get_json()
    answers = data.get("answers", {})  # {str(question_id): answer_str}

    quiz = Quiz.query.get_or_404(quiz_id)
    correct = 0
    for question in quiz.questions:
        student_answer = answers.get(str(question.id), "")
        if student_answer.strip().lower() == question.correct_answer.strip().lower():
            correct += 1

    score = (correct / len(quiz.questions) * 100) if quiz.questions else 0

    attempt.answers = json.dumps(answers)
    attempt.score = round(score, 2)
    attempt.completed = True
    attempt.completed_at = datetime.now(timezone.utc)
    attempt.time_taken_seconds = data.get("timeTakenSeconds")
    db.session.commit()

    return success(attempt.to_dict(), f"Quiz submitted. Score: {score:.1f}%")


@quizzes_bp.get("/<int:quiz_id>/attempts")
@jwt_required()
def get_attempts(quiz_id):
    current_user = get_current_user()
    query = QuizAttempt.query.filter_by(quiz_id=quiz_id)
    if current_user.role == "student":
        query = query.filter_by(student_id=current_user.id)
    attempts = query.order_by(QuizAttempt.started_at.desc()).all()
    return success([a.to_dict() for a in attempts])
