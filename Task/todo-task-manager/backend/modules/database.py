"""SQLite connection and database setup."""
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from pathlib import Path
import sqlite3
from typing import Iterator

PROJECT_DIR = Path(__file__).resolve().parents[2]
DATABASE_PATH = PROJECT_DIR / "data" / "tasks.db"


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Open a connection and always close it when the operation finishes."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_database() -> None:
    """Create the tasks table and add sample rows on first launch."""
    with get_connection() as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                deadline TEXT,
                priority TEXT NOT NULL DEFAULT 'Medium'
                    CHECK(priority IN ('Low', 'Medium', 'High')),
                status TEXT NOT NULL DEFAULT 'Pending'
                    CHECK(status IN ('Pending', 'In progress', 'Completed')),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )"""
        )

        task_count = connection.execute(
            "SELECT COUNT(*) FROM tasks"
        ).fetchone()[0]

        if task_count == 0:
            today = date.today()
            now = datetime.now().isoformat(timespec="seconds")
            sample_tasks = [
                (
                    "Finish project documentation",
                    "Write the project overview and API details.",
                    (today + timedelta(days=1)).isoformat(),
                    "High", "In progress", now, now,
                ),
                (
                    "Review Python basics",
                    "Revise functions, lists, dictionaries, and loops.",
                    (today + timedelta(days=2)).isoformat(),
                    "Medium", "Pending", now, now,
                ),
                (
                    "Test the task manager API",
                    "Try GET, POST, PUT, PATCH, and DELETE in Swagger UI.",
                    today.isoformat(),
                    "High", "Pending", now, now,
                ),
                (
                    "Organize project folders",
                    "Keep frontend and backend code in separate folders.",
                    (today - timedelta(days=1)).isoformat(),
                    "Low", "Completed", now, now,
                ),
            ]
            connection.executemany(
                """INSERT INTO tasks
                   (title, description, deadline, priority, status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                sample_tasks,
            )
