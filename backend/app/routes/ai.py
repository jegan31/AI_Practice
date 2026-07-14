"""
AI routes — trigger Gemini processing on a document and handle Q&A chat.
"""
import json
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.document import Document
from app.models.quiz import Quiz, QuizQuestion
from app.models.flashcard import FlashcardSet, Flashcard
from app.models.study_plan import StudyPlan
from app.services import gemini_service
from app.utils.responses import success, error
from app.utils.auth import teacher_required, get_current_user

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/process/<int:doc_id>")
@jwt_required()
@teacher_required
def process_document(doc_id):
    """Run full AI pipeline: summary + quiz + flashcards on a document."""
    doc = Document.query.get_or_404(doc_id)

    if not doc.extracted_text:
        return error("Document has no extracted text to process")

    doc.ai_processing_status = "processing"
    db.session.commit()

    try:
        current_user = get_current_user()

        # 1. Summary
        summary_data = gemini_service.generate_summary(
            doc.extracted_text, doc.subject, doc.grade_level
        )
        doc.summary = json.dumps(summary_data)

        # 2. Quiz
        questions_data = gemini_service.generate_quiz(
            doc.extracted_text, num_questions=10, subject=doc.subject
        )
        quiz = Quiz(
            title=f"{doc.title} - Auto Quiz",
            document_id=doc.id,
            created_by_id=current_user.id,
            is_published=False,
        )
        db.session.add(quiz)
        db.session.flush()  # get quiz.id

        for i, q in enumerate(questions_data):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q.get("questionText", ""),
                question_type=q.get("questionType", "multiple_choice"),
                options=json.dumps(q.get("options", [])),
                correct_answer=q.get("correctAnswer", ""),
                explanation=q.get("explanation", ""),
                order_index=i,
            )
            db.session.add(question)

        # 3. Flashcards
        cards_data = gemini_service.generate_flashcards(
            doc.extracted_text, num_cards=15, subject=doc.subject
        )
        flashcard_set = FlashcardSet(
            title=f"{doc.title} - Flashcards",
            document_id=doc.id,
            created_by_id=current_user.id,
            is_published=False,
        )
        db.session.add(flashcard_set)
        db.session.flush()

        for i, card in enumerate(cards_data):
            fc = Flashcard(
                set_id=flashcard_set.id,
                front=card.get("front", ""),
                back=card.get("back", ""),
                hint=card.get("hint", ""),
                order_index=i,
            )
            db.session.add(fc)

        doc.ai_processed = True
        doc.ai_processing_status = "completed"
        db.session.commit()

        return success(
            {
                "document": doc.to_dict(),
                "quiz": quiz.to_dict(include_answers=True),
                "flashcardSet": flashcard_set.to_dict(),
            },
            "AI processing completed",
        )

    except Exception as exc:
        db.session.rollback()
        doc.ai_processing_status = "failed"
        db.session.commit()
        return error(f"AI processing failed: {str(exc)}", 500)


@ai_bp.post("/chat/<int:doc_id>")
@jwt_required()
def chat(doc_id):
    """Q&A chat grounded in a specific document."""
    doc = Document.query.get_or_404(doc_id)
    if not doc.extracted_text:
        return error("Document has no text content for Q&A")

    data = request.get_json()
    question = data.get("question", "").strip()
    if not question:
        return error("Question is required")

    conversation_history = data.get("history", [])

    answer = gemini_service.answer_question(
        doc.extracted_text, question, conversation_history
    )
    return success({"question": question, "answer": answer})


@ai_bp.post("/study-plan/<int:doc_id>")
@jwt_required()
def generate_study_plan(doc_id):
    """Generate a personalised study plan for the current student."""
    doc = Document.query.get_or_404(doc_id)
    if not doc.extracted_text:
        return error("Document has no text content")

    data = request.get_json()
    duration_days = data.get("durationDays", 7)
    goal = data.get("goal", "")
    current_user = get_current_user()

    plan_content = gemini_service.generate_study_plan(
        doc.extracted_text,
        duration_days=duration_days,
        goal=goal,
        subject=doc.subject,
        grade_level=doc.grade_level,
    )

    study_plan = StudyPlan(
        title=f"{doc.title} – {duration_days}-Day Study Plan",
        goal=goal,
        duration_days=duration_days,
        plan_content=json.dumps(plan_content),
        document_id=doc.id,
        student_id=current_user.id,
    )
    db.session.add(study_plan)
    db.session.commit()

    return success(study_plan.to_dict(), "Study plan generated", 201)


@ai_bp.get("/summary/<int:doc_id>")
@jwt_required()
def get_summary(doc_id):
    doc = Document.query.get_or_404(doc_id)
    if not doc.summary:
        return error("No summary available. Process the document first.", 404)
    return success(json.loads(doc.summary))
