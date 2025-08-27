@echo off
echo 🚀 CBRCS Docker Setup Check
echo ==========================
echo.

REM Check Docker installation
echo [1/4] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    docker --version
    echo ✅ Docker is installed
)
echo.

REM Check Docker service
echo [2/4] Checking Docker service...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running
    echo Please start Docker Desktop and try again
    echo You can start Docker Desktop from the Start menu
    pause
    exit /b 1
) else (
    echo ✅ Docker is running
)
echo.

REM Check Docker Compose
echo [3/4] Checking Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Desktop is properly installed
    pause
    exit /b 1
) else (
    docker compose version
    echo ✅ Docker Compose is available
)
echo.

REM Check environment file
echo [4/4] Checking environment configuration...
if not exist .env (
    echo ⚠️ .env file not found, creating from template...
    copy .env.example .env >nul
    echo ✅ Created .env file from template
    echo ⚠️ Please review and update the .env file with your settings
) else (
    echo ✅ .env file exists
)
echo.

echo 🎉 Setup check complete!
echo.
echo Next steps:
echo 1. Review and update the .env file if needed
echo 2. Run: docker compose up --build -d
echo 3. Access the app at http://localhost
echo.
pause
