#!/bin/bash

# WhoIsIt Docker Management Script
# This script helps manage Docker containers for the WhoIsIt application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ ${NC}$1"
}

print_error() {
    echo -e "${RED}✖ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_info "Docker and Docker Compose are installed."
}

# Function to display usage
usage() {
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev              Start services in development mode with hot-reload"
    echo "  start            Start services in standard mode"
    echo "  prod             Start services in production mode"
    echo "  stop             Stop all services"
    echo "  restart          Restart all services"
    echo "  build            Build all Docker images"
    echo "  rebuild          Rebuild all Docker images without cache"
    echo "  logs             View logs from all services"
    echo "  logs-backend     View logs from backend service"
    echo "  logs-frontend    View logs from frontend service"
    echo "  logs-db          View logs from database service"
    echo "  shell-backend    Open shell in backend container"
    echo "  shell-frontend   Open shell in frontend container"
    echo "  shell-db         Open PostgreSQL shell"
    echo "  clean            Stop and remove all containers and volumes"
    echo "  status           Show status of all services"
    echo "  help             Show this help message"
    echo ""
}

# Main script logic
case "$1" in
    dev)
        check_docker
        print_info "Starting services in development mode..."
        docker compose -f docker-compose.dev.yml up
        ;;
    
    start)
        check_docker
        print_info "Starting services..."
        docker compose up -d
        print_info "Services started. Access:"
        print_info "  - Frontend: http://localhost:3000"
        print_info "  - Backend: http://localhost:4000"
        print_info "  - Database: localhost:5432"
        ;;
    
    prod)
        check_docker
        if [ ! -f .env.prod ]; then
            print_warning "Warning: .env.prod file not found. Create it from .env.example"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        print_info "Starting services in production mode..."
        docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
        ;;
    
    stop)
        check_docker
        print_info "Stopping services..."
        docker compose down
        docker compose -f docker-compose.dev.yml down 2>/dev/null || true
        docker compose -f docker-compose.prod.yml down 2>/dev/null || true
        print_info "Services stopped."
        ;;
    
    restart)
        check_docker
        print_info "Restarting services..."
        docker compose restart
        print_info "Services restarted."
        ;;
    
    build)
        check_docker
        print_info "Building Docker images..."
        docker compose build
        print_info "Build complete."
        ;;
    
    rebuild)
        check_docker
        print_info "Rebuilding Docker images without cache..."
        docker compose build --no-cache
        print_info "Rebuild complete."
        ;;
    
    logs)
        check_docker
        docker compose logs -f
        ;;
    
    logs-backend)
        check_docker
        docker compose logs -f backend
        ;;
    
    logs-frontend)
        check_docker
        docker compose logs -f frontend
        ;;
    
    logs-db)
        check_docker
        docker compose logs -f postgres
        ;;
    
    shell-backend)
        check_docker
        print_info "Opening shell in backend container..."
        docker compose exec backend sh
        ;;
    
    shell-frontend)
        check_docker
        print_info "Opening shell in frontend container..."
        docker compose exec frontend sh
        ;;
    
    shell-db)
        check_docker
        print_info "Opening PostgreSQL shell..."
        docker compose exec postgres psql -U postgres -d whois_it
        ;;
    
    clean)
        check_docker
        print_warning "This will stop and remove all containers and volumes!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker compose down -v
            docker compose -f docker-compose.dev.yml down -v 2>/dev/null || true
            docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true
            print_info "Cleanup complete."
        fi
        ;;
    
    status)
        check_docker
        print_info "Services status:"
        docker compose ps
        ;;
    
    help|"")
        usage
        ;;
    
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
