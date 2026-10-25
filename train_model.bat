@echo off
echo ========================================================
echo Training LLM-Prop T5 Materials Prediction Model
echo ========================================================
cd /d "%~dp0"
python -m training.train %*
pause
