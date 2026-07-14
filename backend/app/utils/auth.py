from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def get_current_user() -> User | None:
    """Return the currently authenticated User object."""
    try:
        user_id = get_jwt_identity()
        return User.query.get(user_id)
    except Exception:
        return None


def roles_required(*roles):
    """Decorator: enforce that the JWT user has one of the specified roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()
            if not user or user.role not in roles:
                return jsonify({"error": "Forbidden: insufficient permissions"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def teacher_required(fn):
    return roles_required("teacher")(fn)


def student_required(fn):
    return roles_required("student")(fn)


def any_authenticated(fn):
    return roles_required("teacher", "student")(fn)
