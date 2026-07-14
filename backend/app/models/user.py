from datetime import datetime, timezone
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(
        db.Enum("teacher", "student", name="user_role"),
        nullable=False,
        default="student",
    )
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    documents = db.relationship("Document", back_populates="uploader", lazy="dynamic")
    quiz_attempts = db.relationship("QuizAttempt", back_populates="student", lazy="dynamic")
    study_plans = db.relationship("StudyPlan", back_populates="student", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email} [{self.role}]>"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "fullName": f"{self.first_name} {self.last_name}",
            "role": self.role,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat(),
        }
