@echo off
title CRM Development Server
echo ========================================
echo       CRM LOCAL DEVELOPMENT SETUP
echo ========================================
echo.
echo This will start both backend and frontend
echo Backend: http://localhost:3000 or 3001
echo Frontend: http://localhost:5173
echo Database: MongoDB Atlas
echo.
echo Press any key to start...
pause > nul

echo.
echo Starting Backend Server...
start "CRM Backend" cmd /k "cd /d e:\CRM new\crm\server && npm start"

echo Waiting for backend to start...
timeout /t 5 > nul

echo.
echo Starting Frontend Server...
start "CRM Frontend" cmd /k "cd /d e:\CRM new\crm\client && npm run dev"

echo.
echo ========================================
echo       CRM IS RUNNING!
echo ========================================
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login with: admin / admin123
echo.
echo Press any key to stop servers...
pause > nul

echo.
echo Stopping servers...
taskkill /f /im node.exe > nul 2>&1
echo Done!
pause
