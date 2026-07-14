"""
Run this once to create tables and seed a default teacher account.
Usage: python init_db.py
"""
from app import create_app, db, bcrypt
from app.models.user import User

app = create_app("development")

with app.app_context():
    db.create_all()
    print("Database tables created.")

    # Seed default teacher
    if not User.query.filter_by(email="teacher@school.com").first():
        teacher = User(
            email="teacher@school.com",
            password_hash=bcrypt.generate_password_hash("Teacher@123").decode("utf-8"),
            first_name="Admin",
            last_name="Teacher",
            role="teacher",
        )
        db.session.add(teacher)

    # Seed demo student
    if not User.query.filter_by(email="student@school.com").first():
        student = User(
            email="student@school.com",
            password_hash=bcrypt.generate_password_hash("Student@123").decode("utf-8"),
            first_name="Demo",
            last_name="Student",
            role="student",
        )
        db.session.add(student)

    db.session.commit()
    print("Seed data created.")
    print("  Teacher: teacher@school.com / Teacher@123")
    print("  Student: student@school.com / Student@123")
