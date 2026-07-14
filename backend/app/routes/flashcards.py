from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.flashcard import FlashcardSet
from app.utils.responses import success, error, paginated
from app.utils.auth import teacher_required, get_current_user

flashcards_bp = Blueprint("flashcards", __name__)


@flashcards_bp.get("/")
@jwt_required()
def list_sets():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 10, type=int)
    current_user = get_current_user()

    query = FlashcardSet.query
    if current_user.role == "student":
        query = query.filter_by(is_published=True)

    total = query.count()
    sets = (
        query.order_by(FlashcardSet.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return paginated([s.to_dict() for s in sets], total, page, per_page)


@flashcards_bp.get("/<int:set_id>")
@jwt_required()
def get_set(set_id):
    current_user = get_current_user()
    fc_set = FlashcardSet.query.get_or_404(set_id)
    if current_user.role == "student" and not fc_set.is_published:
        return error("This flashcard set is not available", 403)
    return success(fc_set.to_dict())


@flashcards_bp.put("/<int:set_id>/publish")
@jwt_required()
@teacher_required
def toggle_publish(set_id):
    fc_set = FlashcardSet.query.get_or_404(set_id)
    fc_set.is_published = not fc_set.is_published
    db.session.commit()
    status = "published" if fc_set.is_published else "unpublished"
    return success(fc_set.to_dict(), f"Flashcard set {status}")
