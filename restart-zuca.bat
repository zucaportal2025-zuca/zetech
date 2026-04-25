@echo off
title ZUCA PORTAL RESTART

echo =====================================
echo Restarting ZUCA Portal...
echo =====================================

echo.
echo Stopping existing services...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 2 >nul

echo.
echo Starting Backend...
start cmd /k "cd backend && node server.js"

timeout /t 3 >nul

echo Starting Frontend (Network Mode)...
start cmd /k "cd frontend && npm run dev -- --host"

timeout /t 5 >nul

echo Opening Browser...
start http://192.168.100.141:5173

echo.
echo =====================================
echo ZUCA Portal Restarted
echo =====================================
pause