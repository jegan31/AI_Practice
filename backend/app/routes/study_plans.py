from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.study_plan import StudyPlan
from app.utils.responses import success, error
from app.utils.auth import get_current_user

study_plans_bp = Blueprint("study_plans", __name__)


@study_plans_bp.get("/")
@jwt_required()
def list_study_plans():
    current_user = get_current_user()
    plans = (
        StudyPlan.query.filter_by(student_id=current_user.id)
        .order_by(StudyPlan.created_at.desc())
        .all()
    )
    return success([p.to_dict() for p in plans])


@study_plans_bp.get("/<int:plan_id>")
@jwt_required()
def get_study_plan(plan_id):
    current_user = get_current_user()
    plan = StudyPlan.query.get_or_404(plan_id)
    if plan.student_id != current_user.id and current_user.role != "teacher":
        return error("Forbidden", 403)
    return success(plan.to_dict())


@study_plans_bp.delete("/<int:plan_id>")
@jwt_required()
def delete_study_plan(plan_id):
    current_user = get_current_user()
    plan = StudyPlan.query.get_or_404(plan_id)
    if plan.student_id != current_user.id and current_user.role != "teacher":
        return error("Forbidden", 403)
    db.session.delete(plan)
    db.session.commit()
    return success(message="Study plan deleted")
