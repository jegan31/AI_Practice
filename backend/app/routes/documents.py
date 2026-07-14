from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.document import Document
from app.utils.responses import success, error, paginated
from app.utils.auth import teacher_required, get_current_user
from app.utils.files import allowed_file, save_upload, extract_text_from_pdf, delete_upload

documents_bp = Blueprint("documents", __name__)


@documents_bp.post("/upload")
@jwt_required()
@teacher_required
def upload_document():
    if "file" not in request.files:
        return error("No file provided")

    file = request.files["file"]
    if file.filename == "":
        return error("No file selected")

    if not allowed_file(file.filename):
        return error("Only PDF files are allowed")

    stored_name, full_path = save_upload(file)
    extracted_text, page_count = extract_text_from_pdf(full_path)

    current_user = get_current_user()
    doc = Document(
        title=request.form.get("title", file.filename),
        original_filename=file.filename,
        stored_filename=stored_name,
        file_size=request.content_length,
        page_count=page_count,
        subject=request.form.get("subject", ""),
        grade_level=request.form.get("gradeLevel", ""),
        description=request.form.get("description", ""),
        extracted_text=extracted_text,
        uploader_id=current_user.id,
        ai_processing_status="pending",
    )
    db.session.add(doc)
    db.session.commit()

    return success(doc.to_dict(), "Document uploaded successfully", 201)


@documents_bp.get("/")
@jwt_required()
def list_documents():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 10, type=int)
    subject = request.args.get("subject")

    query = Document.query
    if subject:
        query = query.filter(Document.subject.ilike(f"%{subject}%"))

    total = query.count()
    docs = (
        query.order_by(Document.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return paginated([d.to_dict() for d in docs], total, page, per_page)


@documents_bp.get("/<int:doc_id>")
@jwt_required()
def get_document(doc_id):
    current_user = get_current_user()
    doc = Document.query.get_or_404(doc_id)
    include_text = current_user.role == "teacher"
    return success(doc.to_dict(include_text=include_text))


@documents_bp.put("/<int:doc_id>")
@jwt_required()
@teacher_required
def update_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    data = request.get_json()

    for field in ("title", "subject", "description"):
        if field in data:
            setattr(doc, field, data[field])
    if "gradeLevel" in data:
        doc.grade_level = data["gradeLevel"]

    db.session.commit()
    return success(doc.to_dict(), "Document updated")


@documents_bp.delete("/<int:doc_id>")
@jwt_required()
@teacher_required
def delete_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    delete_upload(doc.stored_filename)
    db.session.delete(doc)
    db.session.commit()
    return success(message="Document deleted")
