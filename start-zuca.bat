@echo off
title ZUCA PORTAL AUTO START

echo =====================================
echo Starting ZUCA Portal...
echo =====================================

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
echo ACCESS FROM PHONE USING:
echo http://192.168.100.141:5173
echo =====================================

pause