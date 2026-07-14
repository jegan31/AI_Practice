from datetime import datetime, timezone
from app import db


class FlashcardSet(db.Model):
    __tablename__ = "flashcard_sets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_published = db.Column(db.Boolean, default=False)

    document_id = db.Column(db.Integer, db.ForeignKey("documents.id"), nullable=False)
    document = db.relationship("Document", back_populates="flashcard_sets")
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    cards = db.relationship(
        "Flashcard", back_populates="flashcard_set", lazy="joined", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "isPublished": self.is_published,
            "documentId": self.document_id,
            "createdById": self.created_by_id,
            "cardCount": len(self.cards),
            "cards": [c.to_dict() for c in self.cards],
            "createdAt": self.created_at.isoformat(),
        }


class Flashcard(db.Model):
    __tablename__ = "flashcards"

    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey("flashcard_sets.id"), nullable=False)
    flashcard_set = db.relationship("FlashcardSet", back_populates="cards")

    front = db.Column(db.Text, nullable=False)   # Question / term
    back = db.Column(db.Text, nullable=False)    # Answer / definition
    hint = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "setId": self.set_id,
            "front": self.front,
            "back": self.back,
            "hint": self.hint,
            "orderIndex": self.order_index,
        }
