"""Start the FastAPI app and serve the frontend files."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.modules.database import init_database
from backend.modules.task_routes import router as task_router

PROJECT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

app = FastAPI(
    title="To-Do Task Manager API",
    description="A simple task manager using FastAPI, SQLite, HTML, CSS, and JavaScript.",
    version="1.0.0",
)

# Reuse the same frontend folders to serve CSS and JavaScript files.
app.mount("/css", StaticFiles(directory=FRONTEND_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=FRONTEND_DIR / "js"), name="js")
app.include_router(task_router, prefix="/api")


@app.on_event("startup")
def setup_database() -> None:
    init_database()


@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")
