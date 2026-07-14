from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db, bcrypt
from app.models.user import User
from app.utils.responses import success, error, paginated
from app.utils.auth import teacher_required, get_current_user

users_bp = Blueprint("users", __name__)


@users_bp.get("/")
@jwt_required()
@teacher_required
def list_users():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    role = request.args.get("role")

    query = User.query
    if role:
        query = query.filter_by(role=role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginated([u.to_dict() for u in users], total, page, per_page)


@users_bp.get("/<int:user_id>")
@jwt_required()
def get_user(user_id):
    current = get_current_user()
    # Students can only see their own profile
    if current.role == "student" and current.id != user_id:
        return error("Forbidden", 403)

    user = User.query.get_or_404(user_id)
    return success(user.to_dict())


@users_bp.put("/<int:user_id>")
@jwt_required()
def update_user(user_id):
    current = get_current_user()
    if current.role == "student" and current.id != user_id:
        return error("Forbidden", 403)

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if "firstName" in data:
        user.first_name = data["firstName"].strip()
    if "lastName" in data:
        user.last_name = data["lastName"].strip()
    if "password" in data and data["password"]:
        user.password_hash = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    # Only teachers/admins can toggle active status
    if "isActive" in data and current.role == "teacher":
        user.is_active = bool(data["isActive"])

    db.session.commit()
    return success(user.to_dict(), "User updated")


@users_bp.delete("/<int:user_id>")
@jwt_required()
@teacher_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = False  # soft delete
    db.session.commit()
    return success(message="User deactivated")
