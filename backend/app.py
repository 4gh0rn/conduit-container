import os
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS


DB_PATH = Path(os.getenv("DB_PATH", "/app/data/conduit.db"))
DEFAULT_ARTICLES = [
    {
        "title": "Container Orchestration 101",
        "description": "A quick primer on running multiple services in Docker.",
        "body": "Learn how docker-compose simplifies multi-service workflows.",
        "author": "Ops Team",
    },
    {
        "title": "Hardening Your Images",
        "description": "Security tips for production-ready containers.",
        "body": "Use multi-stage builds, drop root privileges, and pin versions.",
        "author": "Security Guild",
    },
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(get_connection()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                body TEXT NOT NULL,
                author TEXT NOT NULL
            );
            """
        )
        cursor = conn.execute("SELECT COUNT(1) as count FROM articles;")
        count = cursor.fetchone()["count"]
        if count == 0:
            conn.executemany(
                """
                INSERT INTO articles (title, description, body, author)
                VALUES (:title, :description, :body, :author);
                """,
                DEFAULT_ARTICLES,
            )
        conn.commit()


def serialize_article(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "body": row["body"],
        "author": row["author"],
    }


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(
        app,
        resources={r"/api/*": {"origins": os.getenv("CORS_ALLOW_ORIGINS", "*")}},
    )

    @app.route("/api/health", methods=["GET"])
    def health() -> Any:
        return jsonify(
            {
                "status": "ok",
                "service": "conduit-backend",
            }
        )

    @app.route("/api/articles", methods=["GET"])
    def list_articles() -> Any:
        with closing(get_connection()) as conn:
            rows = conn.execute(
                "SELECT id, title, description, body, author FROM articles ORDER BY id DESC;"
            ).fetchall()
        articles: List[Dict[str, Any]] = [serialize_article(row) for row in rows]
        return jsonify({"articles": articles})

    @app.route("/api/articles", methods=["POST"])
    def create_article() -> Any:
        payload = request.get_json(silent=True) or {}
        missing = [field for field in ("title", "description", "body", "author") if not payload.get(field)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        with closing(get_connection()) as conn:
            cursor = conn.execute(
                """
                INSERT INTO articles (title, description, body, author)
                VALUES (:title, :description, :body, :author);
                """,
                payload,
            )
            conn.commit()
            article_id = cursor.lastrowid
            row = conn.execute(
                "SELECT id, title, description, body, author FROM articles WHERE id = ?;",
                (article_id,),
            ).fetchone()
        return jsonify({"article": serialize_article(row)}), 201

    @app.route("/api/articles/<int:article_id>", methods=["GET"])
    def get_article(article_id: int) -> Any:
        with closing(get_connection()) as conn:
            row = conn.execute(
                "SELECT id, title, description, body, author FROM articles WHERE id = ?;",
                (article_id,),
            ).fetchone()
        if row is None:
            return jsonify({"error": "Article not found"}), 404
        return jsonify({"article": serialize_article(row)})

    @app.route("/api/articles/<int:article_id>", methods=["DELETE"])
    def delete_article(article_id: int) -> Any:
        with closing(get_connection()) as conn:
            cursor = conn.execute("SELECT id FROM articles WHERE id = ?;", (article_id,))
            row = cursor.fetchone()
            if row is None:
                return jsonify({"error": "Article not found"}), 404
            conn.execute("DELETE FROM articles WHERE id = ?;", (article_id,))
            conn.commit()
        return jsonify({"message": "Article deleted successfully"}), 200

    return app


init_db()
app = create_app()

