"""
Global error handlers — registered on the Flask app so every unhandled
exception and JWT error returns a consistent JSON shape.
"""
from flask import Flask, jsonify
from flask_jwt_extended.exceptions import (
    NoAuthorizationError,
    InvalidHeaderError,
    WrongTokenError,
    RevokedTokenError,
    FreshTokenRequired,
    UserLookupError,
)
from jwt.exceptions import ExpiredSignatureError, DecodeError


def register_error_handlers(app: Flask) -> None:

    # ── 400 Bad Request ───────────────────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"success": False, "error": str(e)}), 400

    # ── 401 Unauthorised ─────────────────────────────────────────────────────
    @app.errorhandler(401)
    def unauthorised(e):
        return jsonify({"success": False, "error": "Authentication required"}), 401

    # ── 403 Forbidden ────────────────────────────────────────────────────────
    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"success": False, "error": "Forbidden"}), 403

    # ── 404 Not Found ────────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    # ── 405 Method Not Allowed ───────────────────────────────────────────────
    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"success": False, "error": "Method not allowed"}), 405

    # ── 413 Payload Too Large ────────────────────────────────────────────────
    @app.errorhandler(413)
    def payload_too_large(e):
        return jsonify({"success": False, "error": "File too large. Maximum size is 16 MB."}), 413

    # ── 422 Unprocessable Entity ─────────────────────────────────────────────
    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"success": False, "error": str(e)}), 422

    # ── 500 Internal Server Error ────────────────────────────────────────────
    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f"Internal server error: {e}", exc_info=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500

    # ── JWT-specific errors ───────────────────────────────────────────────────
    @app.errorhandler(NoAuthorizationError)
    def missing_token(e):
        return jsonify({"success": False, "error": "Missing authorisation token"}), 401

    @app.errorhandler(InvalidHeaderError)
    def invalid_header(e):
        return jsonify({"success": False, "error": "Invalid token header"}), 401

    @app.errorhandler(WrongTokenError)
    def wrong_token(e):
        return jsonify({"success": False, "error": "Wrong token type"}), 401

    @app.errorhandler(RevokedTokenError)
    def revoked_token(e):
        return jsonify({"success": False, "error": "Token has been revoked"}), 401

    @app.errorhandler(FreshTokenRequired)
    def fresh_token_required(e):
        return jsonify({"success": False, "error": "Fresh token required"}), 401

    @app.errorhandler(ExpiredSignatureError)
    def expired_token(e):
        return jsonify({"success": False, "error": "Token has expired"}), 401

    @app.errorhandler(DecodeError)
    def decode_error(e):
        return jsonify({"success": False, "error": "Token decode error"}), 401
