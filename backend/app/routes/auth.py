from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from app import db, bcrypt
from app.models.user import User
from app.utils.responses import success, error
from app.utils.auth import get_current_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json()
    required = ("email", "password", "firstName", "lastName", "role")
    if not all(data.get(f) for f in required):
        return error("All fields are required: email, password, firstName, lastName, role")

    if data["role"] not in ("teacher", "student"):
        return error("role must be 'teacher' or 'student'")

    if User.query.filter_by(email=data["email"].lower()).first():
        return error("Email already registered", 409)

    user = User(
        email=data["email"].lower().strip(),
        password_hash=bcrypt.generate_password_hash(data["password"]).decode("utf-8"),
        first_name=data["firstName"].strip(),
        last_name=data["lastName"].strip(),
        role=data["role"],
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return success(
        {"user": user.to_dict(), "accessToken": access_token, "refreshToken": refresh_token},
        "Registration successful",
        201,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json()
    if not data.get("email") or not data.get("password"):
        return error("Email and password are required")

    user = User.query.filter_by(email=data["email"].lower()).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, data["password"]):
        return error("Invalid email or password", 401)

    if not user.is_active:
        return error("Account is deactivated. Contact your administrator.", 403)

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return success(
        {"user": user.to_dict(), "accessToken": access_token, "refreshToken": refresh_token},
        "Login successful",
    )


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return success({"accessToken": access_token}, "Token refreshed")


@auth_bp.get("/me")
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return error("User not found", 404)
    return success(user.to_dict())
