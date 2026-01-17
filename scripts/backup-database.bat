@echo off
REM Database Backup Script Wrapper
REM This script creates backups of the POS database with various options

setlocal enabledelayedexpansion

echo.
echo ========================================
echo    POS Database Backup Utility
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js to use this script
    pause
    exit /b 1
)

REM Display menu
:menu
echo Please select backup options:
echo.
echo 1. Development Database Backup (Uncompressed)
echo 2. Development Database Backup (Compressed)
echo 3. Production Database Backup (Uncompressed)
echo 4. Production Database Backup (Compressed)
echo 5. Custom Backup Path
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

    set JS_SCRIPT=scripts/backup-database.js
    if not exist "!JS_SCRIPT!" set JS_SCRIPT=resources/scripts/backup-database.js
    
    if "%choice%"=="1" (
        echo.
        echo 📁 Creating development database backup...
        node "!JS_SCRIPT!"
        goto :end
    )
    
    if "%choice%"=="2" (
        echo.
        echo 📁 Creating compressed development database backup...
        node "!JS_SCRIPT!" --compress
        goto :end
    )
    
    if "%choice%"=="3" (
        echo.
        echo 📁 Creating production database backup...
        node "!JS_SCRIPT!" --production
        goto :end
    )
    
    if "%choice%"=="4" (
        echo.
        echo 📁 Creating compressed production database backup...
        node "!JS_SCRIPT!" --production --compress
        goto :end
    )

if "%choice%"=="5" (
    echo.
    set /p custompath="Enter custom backup path (e.g., C:\Backups\my-backup.sqlite): "
    if "!custompath!"=="" (
        echo ❌ No path specified
        goto :menu
    )
    echo.
    echo 📁 Creating backup to custom location...
    node "!JS_SCRIPT!" --output "!custompath!"
    goto :end
)

if "%choice%"=="6" (
    echo.
    echo 👋 Goodbye!
    exit /b 0
)

echo.
echo ❌ Invalid choice. Please try again.
goto :menu

:end
echo.
echo ✅ Backup operation completed!
echo.
echo 💡 Tips:
echo    - Backups are stored in the 'backups' folder
echo    - Compressed backups save space but take longer to create
echo    - Use restore-database.bat to restore from backup
echo.
pause
