"""REST endpoints for task operations."""
from typing import Optional

from fastapi import APIRouter, Query, Response

from backend.modules.schemas import TaskCreate, TaskStatusUpdate, TaskUpdate
from backend.modules import task_service

router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "message": "Task Manager API is running"}


@router.get("/tasks")
def get_tasks(
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    overdue: bool = Query(default=False),
) -> list[dict]:
    return task_service.list_tasks(status, search, priority, overdue)


@router.get("/tasks/{task_id}")
def get_one_task(task_id: int) -> dict:
    return task_service.get_task(task_id)


@router.post("/tasks", status_code=201)
def add_task(data: TaskCreate) -> dict:
    return task_service.create_task(data)


@router.put("/tasks/{task_id}")
def edit_task(task_id: int, data: TaskUpdate) -> dict:
    return task_service.update_task(task_id, data)


@router.patch("/tasks/{task_id}/status")
def edit_task_status(task_id: int, data: TaskStatusUpdate) -> dict:
    return task_service.change_task_status(task_id, data.status)


@router.delete("/tasks/{task_id}", status_code=204)
def remove_task(task_id: int) -> Response:
    task_service.delete_task(task_id)
    return Response(status_code=204)
