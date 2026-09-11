@echo off
title CareerPilot - 1-Click Launch Server
color 0A
echo ========================================================
echo     🚀 CAREERPILOT - AUTONOMOUS AI CAREER ECOSYSTEM
echo ========================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "CareerPilot Backend" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "CareerPilot Frontend" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ✅ Both servers are running!
echo Opening CareerPilot in your browser...
start http://localhost:5173

echo.
echo To stop the servers, simply close the opened terminal windows.
pause
