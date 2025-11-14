@echo off
echo ========================================
echo   WINDOWS FIREWALL CONFIGURATION
echo ========================================
echo.
echo This will configure Windows Firewall to allow:
echo - Backend (Port 5000)
echo - Frontend (Port 5173)
echo.
echo For ALL network profiles (Private, Public, Domain)
echo.
pause

echo.
echo Removing old rules...
netsh advfirewall firewall delete rule name="Node Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="Node Backend Private" >nul 2>&1
netsh advfirewall firewall delete rule name="Node Backend Public" >nul 2>&1
netsh advfirewall firewall delete rule name="Vite HTTPS Dev" >nul 2>&1
netsh advfirewall firewall delete rule name="Vite HTTPS Private" >nul 2>&1
echo [OK] Old rules removed

echo.
echo Adding new rules...

REM Backend - All profiles
netsh advfirewall firewall add rule name="Juander Backend (TCP 5000)" dir=in action=allow protocol=TCP localport=5000 profile=any
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend port 5000 - All profiles
) else (
    echo [ERROR] Failed to add backend rule
)

REM Frontend - All profiles  
netsh advfirewall firewall add rule name="Juander Frontend (TCP 5173)" dir=in action=allow protocol=TCP localport=5173 profile=any
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend port 5173 - All profiles
) else (
    echo [ERROR] Failed to add frontend rule
)

echo.
echo ========================================
echo   FIREWALL CONFIGURED
echo ========================================
echo.
echo Testing backend accessibility...
echo.

REM Get IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr 192.168') do (
    for /f "tokens=* delims= " %%b in ("%%a") do set IP=%%b
)

if defined IP (
    echo Your IP: %IP%
    echo.
    echo Test these URLs:
    echo.
    echo From PC:
    echo   http://localhost:5000/health
    echo   http://%IP%:5000/health
    echo.
    echo From Phone:
    echo   http://%IP%:5000/health
    echo   https://%IP%:5173/debug.html
    echo.
) else (
    echo Could not detect IP address
)

echo ========================================
echo.
echo If phone still can't connect:
echo 1. Check Windows Defender Firewall is ON
echo 2. Ensure PC and phone on SAME WiFi
echo 3. Try disabling firewall temporarily to test
echo 4. Check router settings (AP isolation)
echo.
pause
