@echo off
echo Starting Electron development environment...
echo.

echo Building electron main process...
npm run build:electron:main
if %errorlevel% neq 0 (
    echo Failed to build electron main process
    exit /b %errorlevel%
)

echo Starting Vite development server...
start "" npm run dev

echo Waiting for server to start...
timeout /t 10 /nobreak >nul

echo Starting Electron app...
npx electron .