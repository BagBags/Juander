@echo off
echo ========================================
echo  CREATING UNIX-COMPATIBLE ZIP
echo ========================================
echo.

cd /d "%~dp0"

REM Check if 7-Zip is installed
if exist "C:\Program Files\7-Zip\7z.exe" (
    set SEVENZIP="C:\Program Files\7-Zip\7z.exe"
) else if exist "C:\Program Files (x86)\7-Zip\7z.exe" (
    set SEVENZIP="C:\Program Files (x86)\7-Zip\7z.exe"
) else (
    echo ========================================
    echo  7-Zip NOT FOUND!
    echo ========================================
    echo.
    echo Please install 7-Zip from: https://www.7-zip.org/
    echo.
    echo Or use WSL/Git Bash method instead.
    echo.
    pause
    exit /b 1
)

echo Found 7-Zip at: %SEVENZIP%
echo.

REM Delete old ZIP if exists
if exist "..\juander-backend-UNIX.zip" (
    echo Deleting old ZIP...
    del "..\juander-backend-UNIX.zip"
)

echo Creating ZIP with Unix-compatible paths...
echo.

REM Create ZIP with Unix line endings and paths (exclude node_modules to force rebuild on Linux)
%SEVENZIP% a -tzip "..\juander-backend-UNIX.zip" * -x!node_modules -x!.git

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✓ SUCCESS!
    echo ========================================
    echo.
    echo ZIP created: D:\Desktop\Juander\juander-backend-UNIX.zip
    echo.
    echo This ZIP uses Unix-compatible paths and will work on EB!
    echo.
    echo ========================================
    echo  DEPLOY NOW:
    echo ========================================
    echo.
    echo 1. AWS Console → Elastic Beanstalk
    echo 2. Select: juander-backend-env
    echo 3. Upload and deploy
    echo 4. Choose: juander-backend-UNIX.zip
    echo 5. Version: v7-unix-paths-fix
    echo 6. Deploy
    echo 7. WAIT 10-15 minutes
    echo.
) else (
    echo.
    echo ✗ Failed to create ZIP
    echo.
)

pause
