@echo off
echo ========================================
echo   MF Fitness Virtual Tour - Local Server
echo ========================================
echo.
echo Starting local web server...
echo.
echo Once the server starts, your browser will open automatically.
echo If not, manually open: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server when done.
echo.
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Or open index.html directly in your browser
    echo.
    pause
    exit /b 1
)

REM Start Python HTTP server and open browser
start http://localhost:8000
python -m http.server 8000
