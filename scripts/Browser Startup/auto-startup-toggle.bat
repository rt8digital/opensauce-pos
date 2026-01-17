@echo off
setlocal EnableDelayedExpansion

title OpenSauce POS - Auto-Startup Toggle
color 0E

echo.
echo ==================================================
echo      OpenSauce POS - Windows Auto-Startup Toggle
echo ==================================================
echo.

:: Set variables using relative paths for portability
set "SCRIPTS_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPTS_DIR%.."
set "LAUNCH_SCRIPT=%SCRIPTS_DIR%launch-app.bat"
set "STARTUP_KEY=HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run"
set "APP_NAME=OpenSaucePOS"

:: Check if launch-app.bat exists in the same directory
if not exist "%LAUNCH_SCRIPT%" (
    echo Error: launch-app.bat not found in the same directory.
    echo Please ensure both scripts are in the same folder.
    pause
    exit /b 1
)

:: Function to check if app is in startup
:check_startup_status
echo Checking current startup status...
echo ===================================

:: Query Windows registry for startup entry
reg query "%STARTUP_KEY%" /v "%APP_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    set "STARTUP_STATUS=ENABLED"
    echo Current status: AUTO-STARTUP IS ENABLED
    echo The POS application will start automatically when Windows starts.
) else (
    set "STARTUP_STATUS=DISABLED"
    echo Current status: AUTO-STARTUP IS DISABLED
    echo The POS application will NOT start automatically when Windows starts.
)

exit /b 0

:: Function to enable auto-startup
:enable_startup
echo.
echo Enabling Windows auto-startup...
echo ===============================

:: Add to Windows startup registry
reg add "%STARTUP_KEY%" /v "%APP_NAME%" /t REG_SZ /d "\"%LAUNCH_SCRIPT%\"" /f >nul 2>&1

if !errorlevel! equ 0 (
    echo ✓ Successfully enabled auto-startup!
    echo The POS application will now start automatically when Windows starts.
    echo.
    echo Startup entry added:
    echo   Name: %APP_NAME%
    echo   Command: %LAUNCH_SCRIPT%
) else (
    echo ✗ Failed to enable auto-startup.
    echo Please run as Administrator or check registry permissions.
)

exit /b 0

:: Function to disable auto-startup
:disable_startup
echo.
echo Disabling Windows auto-startup...
echo =================================

:: Remove from Windows startup registry
reg delete "%STARTUP_KEY%" /v "%APP_NAME%" /f >nul 2>&1

if !errorlevel! equ 0 (
    echo ✓ Successfully disabled auto-startup!
    echo The POS application will NOT start automatically when Windows starts.
) else (
    echo ✗ Failed to disable auto-startup.
    echo The application may not have been in startup, or there was a permission issue.
)

exit /b 0

:: Function to launch app immediately
:launch_now
echo.
echo Launching POS application now...
echo ===============================

:: Run the launch script
call "%LAUNCH_SCRIPT%"

exit /b 0

:: Main menu
:main_menu
echo.
echo ==================================================
echo What would you like to do?
echo ==================================================
echo.
echo 1. Toggle auto-startup (enable/disable)
echo 2. Enable auto-startup only
echo 3. Disable auto-startup only
echo 4. Launch application now (without changing startup)
echo 5. Exit
echo.
set /p "choice=Enter your choice (1-5): "

if "%choice%"=="1" goto toggle_startup
if "%choice%"=="2" goto enable_startup
if "%choice%"=="3" goto disable_startup
if "%choice%"=="4" goto launch_now
if "%choice%"=="5" goto exit_script

echo Invalid choice. Please enter a number between 1 and 5.
goto main_menu

:: Toggle startup function
:toggle_startup
call:check_startup_status

if "%STARTUP_STATUS%"=="ENABLED" (
    echo.
    echo Auto-startup is currently ENABLED.
    echo Do you want to DISABLE it?
    set /p "confirm=Type 'yes' to disable, or press Enter to cancel: "
    if /i "!confirm!"=="yes" (
        call:disable_startup
    ) else (
        echo Operation cancelled.
    )
) else (
    echo.
    echo Auto-startup is currently DISABLED.
    echo Do you want to ENABLE it?
    set /p "confirm=Type 'yes' to enable, or press Enter to cancel: "
    if /i "!confirm!"=="yes" (
        call:enable_startup
    ) else (
        echo Operation cancelled.
    )
)

echo.
set /p "launch_now=Would you like to launch the application now? (y/n): "
if /i "!launch_now!"=="y" goto launch_now

goto main_menu

:: Exit function
:exit_script
echo.
echo Thank you for using OpenSauce POS!
echo.
pause
exit /b 0

:: Start main execution
call:check_startup_status
echo.
echo Press any key to see the main menu...
pause >nul
goto main_menu