@echo off
setlocal EnableDelayedExpansion

title OpenSauce POS - Launch Application
color 0B

echo.
echo ===============================================
echo       OpenSauce POS - Quick Launch
echo ===============================================
echo.

:: Set variables using relative paths for portability
set "SCRIPTS_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPTS_DIR%.."
set "BACKEND_PORT=5001"
set "FRONTEND_PORT=5173"

:: Change to project directory
pushd "%PROJECT_DIR%"

echo Checking system requirements...
echo =================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed.
    echo Please run setup-and-launch.bat first or install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo Node.js found:
    node --version
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Error: Dependencies not installed.
    echo Please run setup-and-launch.bat first to install dependencies.
    pause
    exit /b 1
)

echo.
echo Cleaning up any existing processes...
echo =====================================

:: Kill any existing Node.js processes on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT%"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%FRONTEND_PORT%"') do taskkill /f /pid %%a >nul 2>&1

:: Wait a moment for processes to terminate
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
echo ============================

:: Start backend server in background
echo Starting backend server on port %BACKEND_PORT%...
start "POS Backend Server" /min cmd /c "npm run start:server"

:: Wait for server to start
echo Waiting for backend server to initialize...
timeout /t 8 /nobreak >nul

:: Check if server is running
:check_server
curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Server not ready yet, waiting...
    timeout /t 3 /nobreak >nul
    goto check_server
)

echo Backend server is running!

echo.
echo Starting frontend server...
echo =============================

:: Start Vite dev server in background
echo Starting frontend server on port %FRONTEND_PORT%...
start "POS Frontend Server" cmd /c "npm run start:vite:electron"

:: Wait for frontend to start
echo Waiting for frontend server to initialize...
timeout /t 12 /nobreak >nul

:: Check if frontend is running
:check_frontend
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if %errorlevel% neq 0 (
    echo Frontend not ready yet, waiting...
    timeout /t 3 /nobreak >nul
    goto check_frontend
)

echo Frontend server is running!

echo.
echo Launching application in browser...
echo ===================================

:: Open browser
start http://localhost:%FRONTEND_PORT%

echo.
echo ===============================================
echo          APPLICATION LAUNCHED SUCCESSFULLY
echo ===============================================
echo.
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Backend:  http://localhost:%BACKEND_PORT%
echo.
echo All POS features are now available:
echo - Point of Sale System
echo - Inventory Management
echo - Customer Management  
echo - Sales Reports
echo - WhatsApp Integration
echo - Bluetooth Peripherals Support
echo.
echo This window will close automatically in 5 seconds...
timeout /t 5 /nobreak >nul

exit /b 0