@echo off
setlocal
cd /d "%~dp0"
echo =====================================
echo       TO-DO TASK MANAGER
echo =====================================
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
  if errorlevel 1 (
    python -m venv .venv
    if errorlevel 1 (
      echo Python was not found. Install Python 3.10+ and enable Add Python to PATH.
      pause
      exit /b 1
    )
  )
)
echo Installing/checking dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  echo Dependency installation failed. Check your internet connection and retry.
  pause
  exit /b 1
)
echo App: http://127.0.0.1:8000
echo API docs: http://127.0.0.1:8000/docs
echo Keep this window open. Press Ctrl+C to stop the server.
".venv\Scripts\python.exe" -m uvicorn backend.main:app --reload
pause
