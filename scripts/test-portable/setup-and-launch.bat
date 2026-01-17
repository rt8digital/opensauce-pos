@echo off
setlocal EnableDelayedExpansion

title OpenSauce POS - Complete Setup and Launch
color 0A

echo.
echo ===============================================
echo    OpenSauce POS - Complete Setup and Launch
echo ===============================================
echo.

:: Set variables using relative paths for portability
set "SCRIPTS_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPTS_DIR%.."
set "NODE_VERSION=20"
set "MAX_RETRIES=3"

:: Change to project directory
pushd "%PROJECT_DIR%"

echo [1/8] Checking system requirements...
echo =======================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Installing Node.js...
    call:install_nodejs
    if !errorlevel! neq 0 (
        echo Failed to install Node.js. Please install manually from https://nodejs.org/
        pause
        exit /b 1
    )
) else (
    echo Node.js is installed:
    node --version
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm not found. Please install npm or reinstall Node.js.
    pause
    exit /b 1
) else (
    echo npm is installed:
    npm --version
)

echo.
echo [2/8] Installing project dependencies...
echo =========================================

:: Clean node_modules and package-lock.json if they exist
if exist "node_modules" (
    echo Cleaning existing node_modules...
    rmdir /s /q "node_modules" 2>nul
)
if exist "package-lock.json" (
    del /q "package-lock.json" 2>nul
)

:: Install dependencies
echo Installing npm dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error installing npm dependencies
    echo Retrying with --force flag...
    npm install --force
    if !errorlevel! neq 0 (
        echo Failed to install dependencies. Please check the error messages above.
        pause
        exit /b 1
    )
)

echo.
echo [3/8] Building project components...
echo =====================================

:: Build the project
echo Building client application...
npm run build:mobile
if %errorlevel% neq 0 (
    echo Error building client application
    pause
    exit /b 1
)

echo Building server application...
npm run build:server
if %errorlevel% neq 0 (
    echo Error building server application
    pause
    exit /b 1
)

echo Building Electron components...
npm run build:electron
if %errorlevel% neq 0 (
    echo Error building Electron components
    pause
    exit /b 1
)

:: Rebuild native dependencies for Windows
echo Rebuilding native dependencies for Windows...
npm rebuild serialport --build-from-source
if %errorlevel% neq 0 (
    echo Warning: Could not rebuild serialport (this may be ok if you don't need serial port support)
)

echo.
echo [4/8] Preparing database...
echo ============================

:: Create database directory if it doesn't exist
if not exist "userData" mkdir userData

:: Check if database exists, if not it will be created on first run
if exist "sqlite.db" (
    echo Found existing database file
) else (
    echo Database will be created on first run
)

echo.
echo [5/8] Starting backend server...
echo =================================

:: Kill any existing Node.js processes on our ports
echo Cleaning up any existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do taskkill /f /pid %%a >nul 2>&1

:: Start backend server in background
echo Starting backend server on port 5001...
start "POS Backend Server" /min cmd /c "npm run start:server"

:: Wait for server to start
echo Waiting for backend server to initialize...
timeout /t 10 /nobreak >nul

:: Check if server is running
:check_server
curl -s http://localhost:5001/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Server not ready yet, waiting...
    timeout /t 5 /nobreak >nul
    goto check_server
)

echo Backend server is running!

echo.
echo [6/8] Starting frontend development server...
echo =============================================

:: Start Vite dev server in background
echo Starting frontend development server on port 5173...
start "POS Frontend Server" cmd /c "npm run start:vite:electron"

:: Wait for frontend to start
echo Waiting for frontend server to initialize...
timeout /t 15 /nobreak >nul

:: Check if frontend is running
:check_frontend
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo Frontend not ready yet, waiting...
    timeout /t 5 /nobreak >nul
    goto check_frontend
)

echo Frontend server is running!

echo.
echo [7/8] Launching application in browser...
echo ==========================================

:: Open browser
echo Opening POS application in default browser...
start http://localhost:5173

:: Alternative: You can also launch Electron app if preferred
:: echo Starting Electron desktop application...
:: start "POS Desktop App" cmd /c "npm run start:electron:app"

echo.
echo [8/8] Setup completed successfully!
echo ====================================

echo.
echo ===============================================
echo                POS APPLICATION READY
echo ===============================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5001
echo.
echo Features available:
echo - Point of Sale System
echo - Inventory Management  
echo - Customer Management
echo - Sales Reports
echo - WhatsApp Integration
echo - Bluetooth Peripherals Support
echo.
echo To stop the application, close this window or press Ctrl+C in the server windows.
echo.
echo Press any key to open the application in browser...
pause >nul

:: Open browser again to ensure it's visible
start http://localhost:5173

echo.
echo Application is now running! You can close this window.
echo The backend and frontend servers will continue running.
pause

exit /b 0

:: Function to install Node.js using Chocolatey
:install_nodejs
echo Checking for Chocolatey...

:: Check if choco is available
choco --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey not found. Installing Chocolatey...
    
    :: Install Chocolatey
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    
    if !errorlevel! neq 0 (
        echo Failed to install Chocolatey
        echo Please install Node.js manually from https://nodejs.org/
        exit /b 1
    )
    
    echo Chocolatey installed successfully
)

echo Installing Node.js version %NODE_VERSION%...
choco install nodejs --version=%NODE_VERSION% -y

if !errorlevel! neq 0 (
    echo Failed to install Node.js via Chocolatey
    echo Please install Node.js manually from https://nodejs.org/
    exit /b 1
)

:: Refresh environment variables
call refreshenv.cmd 2>nul || call refreshenv 2>nul || echo Please restart your command prompt and run this script again.

exit /b 0