@echo off
echo ==============================================
echo   Starting Leave Tracker (Backend + Frontend)
echo ==============================================

cd /d "%~dp0leave-tracker\server"
start "Leave Tracker - Backend" cmd /k "npm run dev"

cd /d "%~dp0leave-tracker\client"
start "Leave Tracker - Frontend" cmd /k "npm run dev"

echo.
echo Dono servers start ho gaye hain!
echo Browser open ho raha hai...
timeout /t 3 >nul
start http://localhost:5173

