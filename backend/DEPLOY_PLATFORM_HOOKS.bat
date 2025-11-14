@echo off
echo ========================================
echo  CREATING DEPLOYMENT WITH PLATFORM HOOKS
echo ========================================
echo.

cd /d "%~dp0"

echo Checking files...
if exist ".platform\nginx\conf.d\upload.conf" (
    echo   ✓ Platform hooks nginx config found
) else (
    echo   ✗ ERROR: .platform folder not found!
    pause
    exit /b 1
)

echo.
echo Creating ZIP...
powershell -Command "Compress-Archive -Path * -DestinationPath ..\juander-backend-PLATFORM-HOOKS.zip -Force"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✓ SUCCESS!
    echo ========================================
    echo.
    echo ZIP created: juander-backend-PLATFORM-HOOKS.zip
    echo.
    echo This ZIP includes:
    echo   - .platform/nginx/conf.d/upload.conf (100MB limit)
    echo   - .platform/hooks/postdeploy/ (creates directories)
    echo   - All backend files
    echo.
    echo ========================================
    echo  DEPLOY NOW:
    echo ========================================
    echo.
    echo 1. Go to AWS Elastic Beanstalk Console
    echo 2. Select: juander-backend-env
    echo 3. Upload and deploy
    echo 4. Choose: juander-backend-PLATFORM-HOOKS.zip
    echo 5. Version: v6-platform-hooks-fix
    echo 6. Deploy
    echo 7. WAIT 10-15 minutes
    echo.
    echo This WILL fix the 413 and CORS errors!
    echo.
) else (
    echo ✗ Failed to create ZIP
)

pause
