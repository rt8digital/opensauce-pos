@echo off
title Add POS Application to Windows Startup

echo Adding POS Application to Windows Startup
echo =========================================

:: Method 1: Registry approach (more reliable than startup folder)
set "REG_PATH=HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run"
set "APP_NAME=POSApplication"
set "TARGET=%~dp0launch.bat"

:: Add to registry
reg add "%REG_PATH%" /v "%APP_NAME%" /t REG_SZ /d "%TARGET%" /f
if %errorlevel% equ 0 (
    echo Successfully added POS Application to Windows startup via registry.
    echo The application will now start automatically when Windows starts.
) else (
    echo Failed to add to registry. Trying startup folder method...

    :: Method 2: Startup folder approach (fallback)
    set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
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

    if %errorlevel% equ 0 (
        echo Successfully added POS Application to Windows startup via startup folder.
    ) else (
        echo Failed to add POS Application to startup. Please try running as Administrator.
    )
)

echo.
echo To remove from startup:
echo - For registry method: Run "reg delete "%REG_PATH%" /v "%APP_NAME%" /f"
echo - For startup folder: Delete "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\POS Application.lnk"
echo.

pause 
