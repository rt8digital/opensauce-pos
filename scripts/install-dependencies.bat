@echo off

title POS Application - Dependency Installation

echo Installing POS Application Dependencies
echo =====================================

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

echo Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error installing Node.js dependencies
    pause
    exit /b 1
)

echo Building client application...
npm run build:mobile
if %errorlevel% neq 0 (
    echo Error building client application
    pause
    exit /b 1
)

echo Building Electron application...
npm run build:electron
if %errorlevel% neq 0 (
    echo Error building Electron application
    pause
    exit /b 1
)

echo Installing native dependencies for Windows...
npm rebuild serialport
if %errorlevel% neq 0 (
    echo Warning: Could not rebuild serialport (this may be ok if you don't need serial port support)
)

echo.
echo Creating Windows startup shortcut...
call:create_startup_shortcut

echo.
echo Installation completed successfully!
echo Run "launch.bat" to start the application.
pause
exit /b 0

:create_startup_shortcut
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%~dp0launch.bat"
set "SHORTCUT_NAME=POS Application.lnk"
set "SHORTCUT_PATH=%STARTUP_DIR%\%SHORTCUT_NAME%"

echo Creating startup shortcut at: %SHORTCUT_PATH%

:: Create a temporary VBS script to create the shortcut
set "VBS_TEMP=%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_TEMP%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_TEMP%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_TEMP%"
echo oLink.TargetPath = "%TARGET%" >> "%VBS_TEMP%"
echo oLink.WorkingDirectory = "%~dp0" >> "%VBS_TEMP%"
echo oLink.Description = "POS Application" >> "%VBS_TEMP%"
echo oLink.Save >> "%VBS_TEMP%"

cscript //nologo "%VBS_TEMP%"
del "%VBS_TEMP%" >nul 2>&1

goto:eof 
