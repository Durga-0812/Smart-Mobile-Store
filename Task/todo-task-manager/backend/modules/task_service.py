"""Reusable task operations. SQL and task rules live here."""
from datetime import date, datetime
from typing import Optional

from fastapi import HTTPException

from backend.modules.database import get_connection
from backend.modules.schemas import TaskCreate, TaskUpdate

ALLOWED_STATUSES = ("Pending", "In progress", "Completed")
ALLOWED_PRIORITIES = ("Low", "Medium", "High")


def task_to_dict(row) -> dict:
    """Convert a SQLite row to a JSON-friendly dictionary."""
    task = dict(row)
    deadline = task["deadline"]
    task["is_overdue"] = bool(
        deadline and deadline < date.today().isoformat()
        and task["status"] != "Completed"
    )
    return task


def clean_title(title: str) -> str:
    title = title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Task title cannot be empty")
    return title


def list_tasks(
    status: Optional[str] = None,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    overdue: bool = False,
) -> list[dict]:
    query = "SELECT * FROM tasks WHERE 1=1"
    values = []

    if status and status != "All":
        if status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status filter")
        query += " AND status = ?"
        values.append(status)

    if priority and priority != "All":
        if priority not in ALLOWED_PRIORITIES:
            raise HTTPException(status_code=422, detail="Invalid priority filter")
        query += " AND priority = ?"
        values.append(priority)

    if search and search.strip():
        search_value = f"%{search.strip()}%"
        query += " AND (title LIKE ? OR description LIKE ?)"
        values.extend([search_value, search_value])

    if overdue:
        query += " AND deadline IS NOT NULL AND deadline < ? AND status != 'Completed'"
        values.append(date.today().isoformat())

    query += """ ORDER BY
        CASE status WHEN 'In progress' THEN 1 WHEN 'Pending' THEN 2 ELSE 3 END,
        deadline IS NULL, deadline ASC, id DESC"""

    with get_connection() as connection:
        rows = connection.execute(query, values).fetchall()
    return [task_to_dict(row) for row in rows]


def get_task(task_id: int) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_dict(row)


def create_task(data: TaskCreate) -> dict:
    title = clean_title(data.title)
    now = datetime.now().isoformat(timespec="seconds")
    values = (
        title,
        data.description.strip(),
        data.deadline.isoformat() if data.deadline else None,
        data.priority,
        data.status,
        now,
        now,
    )
    with get_connection() as connection:
        cursor = connection.execute(
            """INSERT INTO tasks
               (title, description, deadline, priority, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            values,
        )
        new_id = cursor.lastrowid
    return get_task(new_id)


def update_task(task_id: int, data: TaskUpdate) -> dict:
    title = clean_title(data.title)
    now = datetime.now().isoformat(timespec="seconds")
    values = (
        title,
        data.description.strip(),
        data.deadline.isoformat() if data.deadline else None,
        data.priority,
        data.status,
        now,
        task_id,
    )
    with get_connection() as connection:
        cursor = connection.execute(
            """UPDATE tasks
               SET title=?, description=?, deadline=?, priority=?, status=?, updated_at=?
               WHERE id=?""",
            values,
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return get_task(task_id)


def change_task_status(task_id: int, status: str) -> dict:
    if status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid task status")

    now = datetime.now().isoformat(timespec="seconds")
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE tasks SET status=?, updated_at=? WHERE id=?",
            (status, now, task_id),
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return get_task(task_id)


def delete_task(task_id: int) -> None:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM tasks WHERE id = ?", (task_id,)
        )
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
