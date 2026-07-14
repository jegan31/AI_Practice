from datetime import datetime, timezone
from app import db


class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False, unique=True)
    file_size = db.Column(db.Integer)  # bytes
    page_count = db.Column(db.Integer)
    subject = db.Column(db.String(100))
    grade_level = db.Column(db.String(50))
    description = db.Column(db.Text)

    # AI-generated content (stored as JSON strings)
    summary = db.Column(db.Text)
    extracted_text = db.Column(db.Text)
    ai_processed = db.Column(db.Boolean, default=False)
    ai_processing_status = db.Column(
        db.Enum("pending", "processing", "completed", "failed", name="ai_status"),
        default="pending",
    )

    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    uploader = db.relationship("User", back_populates="documents")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Child content
    quizzes = db.relationship("Quiz", back_populates="document", lazy="dynamic")
    flashcard_sets = db.relationship("FlashcardSet", back_populates="document", lazy="dynamic")
    study_plans = db.relationship("StudyPlan", back_populates="document", lazy="dynamic")

    def __repr__(self):
        return f"<Document {self.title}>"

    def to_dict(self, include_text=False):
        data = {
            "id": self.id,
            "title": self.title,
            "originalFilename": self.original_filename,
            "fileSize": self.file_size,
            "pageCount": self.page_count,
            "subject": self.subject,
            "gradeLevel": self.grade_level,
            "description": self.description,
            "summary": self.summary,
            "aiProcessed": self.ai_processed,
            "aiProcessingStatus": self.ai_processing_status,
            "uploaderId": self.uploader_id,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
        if include_text:
            data["extractedText"] = self.extracted_text
        return data
