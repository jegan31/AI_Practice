import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt

from config import config_map

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app(env: str = None) -> Flask:
    env = env or os.environ.get("FLASK_ENV", "development")
    cfg = config_map.get(env, config_map["development"])

    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(cfg)

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    CORS(
        app,
        origins=[app.config["FRONTEND_URL"]],
        supports_credentials=True,
    )

    # ── JWT callbacks ─────────────────────────────────────────────────────────
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"success": False, "error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"success": False, "error": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"success": False, "error": "Authentication token required"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        return jsonify({"success": False, "error": "Token has been revoked"}), 401

    # ── Global error handlers ─────────────────────────────────────────────────
    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.documents import documents_bp
    from app.routes.ai import ai_bp
    from app.routes.quizzes import quizzes_bp
    from app.routes.flashcards import flashcards_bp
    from app.routes.study_plans import study_plans_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(quizzes_bp, url_prefix="/api/quizzes")
    app.register_blueprint(flashcards_bp, url_prefix="/api/flashcards")
    app.register_blueprint(study_plans_bp, url_prefix="/api/study-plans")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "env": env, "version": "1.0.0"})

    logger.info(f"Learning Coach API started in [{env}] mode")
    return app
