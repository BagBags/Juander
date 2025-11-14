@echo off
echo Generating SSL certificates for backend...

cd cert
..\..\..\frontend\cert\mkcert.exe -key-file backend-key.pem -cert-file backend.pem localhost 127.0.0.1 192.168.100.10

echo.
echo SSL certificates generated!
echo backend-key.pem
echo backend.pem
echo.
pause
