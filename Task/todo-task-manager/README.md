# To-Do Task Manager

A beginner-friendly full-stack task manager based on the supplied dashboard image.

## Technology
- Frontend: HTML, CSS, JavaScript modules
- Backend: Python, FastAPI
- Database: SQLite
- API testing: Swagger UI at `/docs`

## Folder structure

```text
todo-task-manager/
├── frontend/
│   ├── index.html                 # Main page
│   ├── css/
│   │   └── style.css              # Dashboard design and responsive styles
│   └── js/
│       ├── main.js                # Connects page events and components
│       ├── api.js                 # Reusable REST API requests
│       ├── utils.js               # Shared helper functions
│       └── components/
│           ├── task_table.js      # Draws the task table
│           ├── task_modal.js      # Create, view, edit, and validate tasks
│           ├── task_stats.js      # Updates summary cards
│           └── toast.js           # Reusable notifications
├── backend/
│   ├── main.py                    # Starts FastAPI and serves frontend files
│   └── modules/
│       ├── database.py             # SQLite connection and table setup
│       ├── schemas.py              # Request validation models
│       ├── task_service.py         # Reusable database/task operations
│       └── task_routes.py          # REST API endpoints
├── data/                           # SQLite file is created here
├── requirements.txt
├── run_windows.bat
└── API_TESTING.md
```

## Run on Windows

1. Install Python 3.10 or newer.
2. Extract the ZIP and open the `todo-task-manager` folder in VS Code.
3. Double-click `run_windows.bat`, or run these commands in the project root terminal:

```powershell
py -m venv .venv
.venv\Scripts\activate
py -m pip install -r requirements.txt
py -m uvicorn backend.main:app --reload
```

4. Open the frontend: http://127.0.0.1:8000
5. Open Swagger API docs: http://127.0.0.1:8000/docs

The script downloads packages the first time, so keep an internet connection active. Leave the server terminal open while using the app. Press `Ctrl+C` to stop the server.

## How the code is organized

- `frontend/js/api.js` contains the shared `taskApi` methods. Components call these methods instead of repeating `fetch()` code.
- `frontend/js/components/` contains small UI components. Each component has one job.
- `frontend/js/main.js` connects filters, buttons, API calls, and components.
- `backend/modules/task_routes.py` defines API URLs.
- `backend/modules/task_service.py` contains reusable task operations and SQL queries.
- `backend/modules/database.py` creates the SQLite database.
- `backend/modules/schemas.py` checks incoming data before it reaches the service layer.

## Features

- Create, view, edit, and delete tasks.
- Pending, In progress, and Completed statuses.
- Low, Medium, and High priority levels.
- Search, priority/status filters, deadline filter, and overdue-only filter.
- Task counts, pagination, and a responsive dashboard.
- Empty-title validation and persistent SQLite storage.
- REST methods: GET, POST, PUT, PATCH, and DELETE.

## API routes

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/health` | Check API status |
| GET | `/api/tasks` | List and filter tasks |
| GET | `/api/tasks/{task_id}` | Read one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{task_id}` | Update a task |
| PATCH | `/api/tasks/{task_id}/status` | Update status only |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

The app creates `data/tasks.db` when it starts. It adds four sample tasks only when the database is empty. Deleting `data/tasks.db` resets the app data and creates the sample tasks again on the next run.
