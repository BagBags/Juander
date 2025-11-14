@echo off
echo ========================================
echo  CREATING ZIP USING WSL (Ubuntu)
echo ========================================
echo.

cd /d "%~dp0"

REM Check if WSL is available
wsl --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WSL not found! Please use 7-Zip method instead.
    pause
    exit /b 1
)

echo Using WSL to create Unix-compatible ZIP...
echo.

REM Convert Windows path to WSL path
set "BACKEND_PATH=%CD%"
set "WSL_PATH=/mnt/%BACKEND_PATH::=%"
set "WSL_PATH=%WSL_PATH:\=/%"

REM Create ZIP using WSL
wsl cd "%WSL_PATH%" ^&^& zip -r ../juander-backend-UNIX.zip . -x "node_modules/.cache/*" ".git/*"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✓ SUCCESS!
    echo ========================================
    echo.
    echo ZIP created: D:\Desktop\Juander\juander-backend-UNIX.zip
    echo.
    echo DEPLOY NOW:
    echo 1. AWS Console → Elastic Beanstalk
    echo 2. Upload: juander-backend-UNIX.zip
    echo 3. Version: v7-unix-paths-fix
    echo 4. Deploy
    echo.
) else (
    echo.
    echo ✗ Failed to create ZIP
    echo Try 7-Zip method instead
    echo.
)

pause
