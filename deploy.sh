#!/bin/bash

# CBRCS Docker Deployment Script
# This script helps deploy the CBRCS application using Docker

set -e

echo "🚀 CBRCS Docker Deployment"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }

print_status "Docker and Docker Compose are installed ✓"

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example"
    cp .env.example .env
    print_warning "Please edit the .env file with your configuration before proceeding"
    echo "Particularly update:"
    echo "  - MONGO_ROOT_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - MONGODB_URI (if using external MongoDB)"
    read -p "Press Enter to continue after updating .env file..."
fi

# Function to deploy the application
deploy() {
    print_status "Building and starting services..."
    
    # Stop any existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up --build -d
    
    print_status "Waiting for services to be healthy..."
    
    # Wait for services to be ready
    timeout=120
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker-compose ps | grep -q "Up.*healthy"; then
            print_status "Services are healthy!"
            break
        fi
        
        if [ $counter -eq $timeout ]; then
            print_error "Services failed to start within $timeout seconds"
            docker-compose logs
            exit 1
        fi
        
        echo -n "."
        sleep 2
        counter=$((counter + 2))
    done
    
    echo ""
    print_status "🎉 CBRCS application deployed successfully!"
    echo ""
    echo "Services:"
    echo "  📱 Frontend: http://localhost"
    echo "  🔧 Backend API: http://localhost:8000"
    echo "  📋 API Docs: http://localhost:8000/docs"
    echo "  🗄️ MongoDB: localhost:27017"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to show logs
logs() {
    docker-compose logs -f
}

# Function to stop services
stop() {
    print_status "Stopping services..."
    docker-compose down
    print_status "Services stopped"
}

# Function to restart services
restart() {
    print_status "Restarting services..."
    docker-compose restart
    print_status "Services restarted"
}

# Function to clean up
clean() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_status "Cleanup complete"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    logs)
        logs
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    clean)
        clean
        ;;
    *)
        echo "Usage: $0 {deploy|logs|stop|restart|clean}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Build and deploy the application (default)"
        echo "  logs    - Show application logs"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  clean   - Remove all containers, images, and volumes"
        exit 1
        ;;
esac
