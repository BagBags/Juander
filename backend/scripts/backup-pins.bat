@echo off
REM Backup script for pins collection before cleanup (Windows)
REM Run this BEFORE running cleanup-pins.bat

echo =========================================
echo   Pins Collection Backup Script
echo =========================================
echo.

REM Load MONGODB_URI from .env
for /f "tokens=1,2 delims==" %%a in ('type ..\.env ^| findstr MONGODB_URI') do set %%a=%%b

REM Check if MONGODB_URI is set
if "%MONGODB_URI%"=="" (
    echo Error: MONGODB_URI not found in .env file
    echo Please set MONGODB_URI in backend/.env
    pause
    exit /b 1
)

REM Create backup directory with timestamp
set TIMESTAMP=%date:~-4%%date:~-7,2%%date:~-10,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=.\backups\pins-backup-%TIMESTAMP%
mkdir "%BACKUP_DIR%" 2>nul

echo Creating backup of pins collection...
echo Backup location: %BACKUP_DIR%
echo.

REM Export pins collection to JSON
mongoexport --uri="%MONGODB_URI%" --collection=pins --out="%BACKUP_DIR%\pins.json" --jsonArray --pretty

if %errorlevel% equ 0 (
    echo.
    echo Backup completed successfully!
    echo Backup saved to: %BACKUP_DIR%\pins.json
    echo.
    echo To restore this backup, run:
    echo   mongoimport --uri="%MONGODB_URI%" --collection=pins --file="%BACKUP_DIR%\pins.json" --jsonArray --drop
) else (
    echo.
    echo Backup failed!
    pause
    exit /b 1
)

pause
