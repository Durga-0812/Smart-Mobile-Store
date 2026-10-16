"""Request models used to validate API input."""
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

Priority = Literal["Low", "Medium", "High"]
Status = Literal["Pending", "In progress", "Completed"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    deadline: Optional[date] = None
    priority: Priority = "Medium"
    status: Status = "Pending"


class TaskUpdate(TaskCreate):
    """The fields required when updating a task."""


class TaskStatusUpdate(BaseModel):
    status: Status
