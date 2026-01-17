@echo off

title POS Application - Launch

echo Starting POS Application
echo ========================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed.
    pause
    exit /b 1
)

echo Starting backend server...
start "POS Backend Server" cmd /c "npm run start:server"

echo Waiting for backend server to start...
timeout /t 5 /nobreak >nul

echo Starting frontend application...
start "POS Frontend" cmd /c "npm run start:vite:electron"

echo.
echo POS Application started successfully!
echo Backend server is running on port assigned by OS
echo Frontend is available at http://127.0.0.1:5173
echo.
echo To start the Electron desktop app, run: npm run start:electron:app
echo.

pause 
