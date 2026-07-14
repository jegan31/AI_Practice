import os
import uuid
from flask import current_app
import pdfplumber


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


def save_upload(file) -> tuple[str, str]:
    """Save an uploaded file with a UUID filename.
    Returns (stored_filename, full_path).
    """
    ext = file.filename.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    file.save(full_path)
    return stored_name, full_path


def extract_text_from_pdf(filepath: str) -> tuple[str, int]:
    """Extract plain text and page count from a PDF.
    Returns (text, page_count).
    """
    text_parts = []
    page_count = 0
    with pdfplumber.open(filepath) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text_parts.append(content)
    return "\n\n".join(text_parts), page_count


def delete_upload(stored_filename: str) -> None:
    """Remove a stored file from disk."""
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_filename)
    if os.path.exists(path):
        os.remove(path)
