@echo off
REM CBRCS Docker Deployment Script for Windows
REM This script helps deploy the CBRCS application using Docker

echo 🚀 CBRCS Docker Deployment
echo ==========================

REM Check if Docker and Docker Compose are installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is required but not installed. Aborting.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is required but not installed. Aborting.
    pause
    exit /b 1
)

echo [INFO] Docker and Docker Compose are installed ✓

REM Check if .env file exists, if not create from example
if not exist .env (
    echo [WARNING] .env file not found. Creating from .env.example
    copy .env.example .env
    echo [WARNING] Please edit the .env file with your configuration before proceeding
    echo Particularly update:
    echo   - MONGO_ROOT_PASSWORD
    echo   - JWT_SECRET
    echo   - MONGODB_URI (if using external MongoDB)
    pause
)

REM Parse command line argument
set "command=%1"
if "%command%"=="" set "command=deploy"

if "%command%"=="deploy" goto :deploy
if "%command%"=="logs" goto :logs
if "%command%"=="stop" goto :stop
if "%command%"=="restart" goto :restart
if "%command%"=="clean" goto :clean
goto :usage

:deploy
echo [INFO] Building and starting services...

REM Stop any existing containers
docker-compose down

REM Build and start services
docker-compose up --build -d

echo [INFO] Waiting for services to be healthy...

REM Wait for services to be ready (simplified for Windows)
timeout /t 30 /nobreak >nul

echo.
echo [INFO] 🎉 CBRCS application deployed successfully!
echo.
echo Services:
echo   📱 Frontend: http://localhost
echo   🔧 Backend API: http://localhost:8000
echo   📋 API Docs: http://localhost:8000/docs
echo   🗄️ MongoDB: localhost:27017
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
pause
goto :end

:logs
docker-compose logs -f
goto :end

:stop
echo [INFO] Stopping services...
docker-compose down
echo [INFO] Services stopped
pause
goto :end

:restart
echo [INFO] Restarting services...
docker-compose restart
echo [INFO] Services restarted
pause
goto :end

:clean
echo [WARNING] This will remove all containers, images, and volumes. Are you sure? (y/N)
set /p response=
if /i "%response%"=="y" (
    echo [INFO] Cleaning up...
    docker-compose down -v --rmi all
    docker system prune -f
    echo [INFO] Cleanup complete
) else (
    echo [INFO] Cleanup cancelled
)
pause
goto :end

:usage
echo Usage: %0 {deploy^|logs^|stop^|restart^|clean}
echo.
echo Commands:
echo   deploy  - Build and deploy the application (default)
echo   logs    - Show application logs
echo   stop    - Stop all services
echo   restart - Restart all services
echo   clean   - Remove all containers, images, and volumes
pause
goto :end

:end
