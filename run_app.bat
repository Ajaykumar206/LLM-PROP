@echo off
echo ========================================================
echo Starting LLM-Prop Full-Stack Server
echo ========================================================
cd /d "%~dp0"
echo Opening browser at http://127.0.0.1:8000 ...
start http://127.0.0.1:8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
