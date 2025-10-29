#!/bin/bash

# Cloud POS System - Docker Management Script
# Usage: ./docker-scripts.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Functions
show_help() {
    echo "Cloud POS System - Docker Management Commands"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Development Commands:"
    echo "  dev-up       Start all services in development mode"
    echo "  dev-down     Stop all development services"
    echo "  dev-logs     Show logs for all development services"
    echo "  dev-build    Build all development images"
    echo ""
    echo "Production Commands:"
    echo "  prod-up      Start all services in production mode"
    echo "  prod-down    Stop all production services"
    echo "  prod-logs    Show logs for all production services"
    echo "  prod-build   Build all production images"
    echo ""
    echo "Database Commands:"
    echo "  db-up        Start only database services"
    echo "  db-down      Stop database services"
    echo "  db-reset     Reset all databases (WARNING: destroys data)"
    echo "  db-migrate   Run database migrations"
    echo "  db-seed      Seed databases with sample data"
    echo ""
    echo "Utility Commands:"
    echo "  health       Check health of all services"
    echo "  logs         Show logs for specific service"
    echo "  shell        Access shell of specific service"
    echo "  clean        Clean up unused images and volumes"
    echo "  tools        Start development tools (pgAdmin, etc.)"
    echo ""
    echo "Examples:"
    echo "  $0 dev-up                    # Start development environment"
    echo "  $0 logs api-gateway          # Show API gateway logs"
    echo "  $0 shell cloudpos-postgres   # Access PostgreSQL shell"
}

# Development environment
dev_up() {
    print_header "Starting Development Environment"
    
    if [ ! -f .env.local ]; then
        print_warning "Creating .env.local from .env.example"
        cp .env.example .env.local
        print_warning "Please update .env.local with your configuration"
    fi
    
    print_status "Starting development services..."
    docker-compose -f docker-compose.yml up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 10
    
    print_status "Development environment is ready!"
    print_status "API Gateway: http://localhost:3000"
    print_status "PgAdmin: http://localhost:8080"
    print_status "Redis Commander: http://localhost:8081"
    print_status "Mongo Express: http://localhost:8082"
}

dev_down() {
    print_header "Stopping Development Environment"
    docker-compose -f docker-compose.yml down
    print_status "Development environment stopped"
}

dev_logs() {
    print_header "Development Services Logs"
    docker-compose -f docker-compose.yml logs -f
}

dev_build() {
    print_header "Building Development Images"
    docker-compose -f docker-compose.yml build --no-cache
    print_status "Development images built successfully"
}

# Production environment
prod_up() {
    print_header "Starting Production Environment"
    
    if [ ! -f .env ]; then
        print_error ".env file not found. Copy .env.production and update values."
        exit 1
    fi
    
    print_status "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_status "Waiting for services to be healthy..."
    sleep 15
    
    print_status "Production environment is ready!"
    print_status "Application: http://localhost"
}

prod_down() {
    print_header "Stopping Production Environment"
    docker-compose -f docker-compose.prod.yml down
    print_status "Production environment stopped"
}

prod_logs() {
    print_header "Production Services Logs"
    docker-compose -f docker-compose.prod.yml logs -f
}

prod_build() {
    print_header "Building Production Images"
    docker-compose -f docker-compose.prod.yml build --no-cache
    print_status "Production images built successfully"
}

# Database commands
db_up() {
    print_header "Starting Database Services"
    docker-compose -f docker-compose.yml up -d postgres redis mongodb
    print_status "Database services started"
}

db_down() {
    print_header "Stopping Database Services"
    docker-compose -f docker-compose.yml stop postgres redis mongodb
    print_status "Database services stopped"
}

db_reset() {
    print_header "Resetting All Databases"
    print_warning "This will destroy all data! Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Stopping services..."
        docker-compose -f docker-compose.yml down
        
        print_status "Removing volumes..."
        docker volume rm cloudpos_postgres_data cloudpos_redis_data cloudpos_mongodb_data 2>/dev/null || true
        
        print_status "Starting fresh databases..."
        docker-compose -f docker-compose.yml up -d postgres redis mongodb
        
        print_status "Database reset complete"
    else
        print_status "Database reset cancelled"
    fi
}

db_migrate() {
    print_header "Running Database Migrations"
    print_status "Starting PostgreSQL migration..."
    
    # Wait for PostgreSQL to be ready
    until docker exec cloudpos-postgres pg_isready -U postgres; do
        print_status "Waiting for PostgreSQL..."
        sleep 2
    done
    
    # Run migrations
    docker exec -i cloudpos-postgres psql -U postgres -d cloudpos < shared/database/migrations/001_initial_schema.sql
    docker exec -i cloudpos-postgres psql -U postgres -d cloudpos < shared/database/migrations/002_indexes.sql
    
    print_status "Migrations completed successfully"
}

db_seed() {
    print_header "Seeding Database with Sample Data"
    
    # Wait for PostgreSQL to be ready
    until docker exec cloudpos-postgres pg_isready -U postgres; do
        print_status "Waiting for PostgreSQL..."
        sleep 2
    done
    
    # Run seed data
    docker exec -i cloudpos-postgres psql -U postgres -d cloudpos < shared/database/migrations/001_initial_data.sql
    
    print_status "Database seeded successfully"
}

# Utility commands
health_check() {
    print_header "Service Health Check"
    
    services=("postgres" "redis" "mongodb" "api-gateway" "auth-service" "transaction-service" "inventory-service" "payment-service" "customer-service" "notification-service")
    
    for service in "${services[@]}"; do
        container_name="cloudpos-$service"
        if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
            print_status "✅ $service is running"
        else
            print_error "❌ $service is not running"
        fi
    done
}

show_logs() {
    if [ -z "$2" ]; then
        print_error "Please specify a service name"
        print_status "Available services: api-gateway, auth-service, transaction-service, inventory-service, payment-service, customer-service, notification-service, postgres, redis, mongodb"
        exit 1
    fi
    
    service_name="$2"
    print_header "Logs for $service_name"
    docker-compose -f docker-compose.yml logs -f "$service_name"
}

access_shell() {
    if [ -z "$2" ]; then
        print_error "Please specify a container name"
        print_status "Example: $0 shell cloudpos-postgres"
        exit 1
    fi
    
    container_name="$2"
    print_header "Accessing shell for $container_name"
    docker exec -it "$container_name" /bin/sh
}

clean_up() {
    print_header "Cleaning Up Docker Resources"
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Removing unused networks..."
    docker network prune -f
    
    print_status "Cleanup completed"
}

start_tools() {
    print_header "Starting Development Tools"
    docker-compose -f docker-compose.yml --profile tools up -d
    
    print_status "Development tools started:"
    print_status "PgAdmin: http://localhost:8080 (admin@cloudpos.com / cloudpos123)"
    print_status "Redis Commander: http://localhost:8081"
    print_status "Mongo Express: http://localhost:8082 (admin / cloudpos123)"
}

# Main command router
case "${1:-help}" in
    "dev-up")
        dev_up
        ;;
    "dev-down")
        dev_down
        ;;
    "dev-logs")
        dev_logs
        ;;
    "dev-build")
        dev_build
        ;;
    "prod-up")
        prod_up
        ;;
    "prod-down")
        prod_down
        ;;
    "prod-logs")
        prod_logs
        ;;
    "prod-build")
        prod_build
        ;;
    "db-up")
        db_up
        ;;
    "db-down")
        db_down
        ;;
    "db-reset")
        db_reset
        ;;
    "db-migrate")
        db_migrate
        ;;
    "db-seed")
        db_seed
        ;;
    "health")
        health_check
        ;;
    "logs")
        show_logs "$@"
        ;;
    "shell")
        access_shell "$@"
        ;;
    "clean")
        clean_up
        ;;
    "tools")
        start_tools
        ;;
    "help"|*)
        show_help
        ;;
esac