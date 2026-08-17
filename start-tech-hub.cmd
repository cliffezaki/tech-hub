@echo off
setlocal

cd /d "%~dp0"

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
    start "" "http://localhost:3000"
    exit /b 0
)

where npm >nul 2>nul
if errorlevel 1 (
    echo Node.js and npm are required to run Tech Hub.
    echo Install the current LTS release from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing Tech Hub dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo Installation failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)

start "Tech Hub Server" cmd /k "cd /d ""%~dp0"" ^&^& npm run dev"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

endlocal
