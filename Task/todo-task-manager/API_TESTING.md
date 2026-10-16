# API Testing Checklist

Open `http://127.0.0.1:8000/docs` after starting the server.

## 1. Health check
- Method: `GET`
- URL: `/api/health`
- Expected: HTTP 200 and status `ok`.

## 2. Create a task
- Method: `POST`
- URL: `/api/tasks`
- Example JSON:

```json
{
  "title": "Prepare project demo",
  "description": "Show the dashboard and REST APIs",
  "deadline": "2026-10-17",
  "priority": "High",
  "status": "Pending"
}
```

- Expected: HTTP 201 and the new task including its ID.

## 3. Get tasks
- Method: `GET`
- URL: `/api/tasks`
- Try the `status`, `search`, `priority`, and `overdue` query parameters.

## 4. Get one task
- Method: `GET`
- URL: `/api/tasks/1`
- Expected: one task or HTTP 404 if the ID does not exist.

## 5. Update a task
- Method: `PUT`
- URL: `/api/tasks/1`
- Send all fields in the create example with the values you want.

## 6. Change status
- Method: `PATCH`
- URL: `/api/tasks/1/status`
- Example JSON: `{ "status": "Completed" }`

## 7. Delete a task
- Method: `DELETE`
- URL: `/api/tasks/1`
- Expected: HTTP 204. The response body is empty.

## Validation tests
- Try creating a task with an empty title. The frontend and backend reject it.
- Try an invalid priority or status. The backend responds with HTTP 422.
- Restart the server, then verify that saved tasks remain in SQLite.
