#!/bin/bash

# CloudPOS Deployment Verification Script
# This script verifies that the deployment environment is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Initialize counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Function to increment counters
pass_check() {
    PASS_COUNT=$((PASS_COUNT + 1))
    print_status "$1"
}

fail_check() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    print_error "$1"
}

warn_check() {
    WARN_COUNT=$((WARN_COUNT + 1))
    print_warning "$1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker installation
check_docker() {
    print_header "Docker Installation"
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version 2>/dev/null || echo "unknown")
        pass_check "Docker is installed: $DOCKER_VERSION"
        
        if docker info >/dev/null 2>&1; then
            pass_check "Docker daemon is running"
        else
            fail_check "Docker daemon is not running"
        fi
    else
        fail_check "Docker is not installed"
        print_info "Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    fi
}

# Check Docker Compose
check_docker_compose() {
    print_header "Docker Compose"
    
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version 2>/dev/null || echo "unknown")
        pass_check "Docker Compose is installed: $COMPOSE_VERSION"
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version 2>/dev/null || echo "unknown")
        pass_check "Docker Compose (plugin) is installed: $COMPOSE_VERSION"
    else
        fail_check "Docker Compose is not installed"
        print_info "Install Docker Compose: https://docs.docker.com/compose/install/"
    fi
}

# Check system resources
check_system_resources() {
    print_header "System Resources"
    
    # Check available memory
    if command_exists free; then
        TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
        if [ "$TOTAL_RAM" -ge 8 ]; then
            pass_check "RAM: ${TOTAL_RAM}GB (meets minimum requirement)"
        elif [ "$TOTAL_RAM" -ge 4 ]; then
            warn_check "RAM: ${TOTAL_RAM}GB (below recommended 8GB+)"
        else
            fail_check "RAM: ${TOTAL_RAM}GB (below minimum requirement)"
        fi
    else
        warn_check "Cannot check RAM (free command not available)"
    fi
    
    # Check available disk space
    if command_exists df; then
        AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        if [ "$AVAILABLE_SPACE" -ge 100 ]; then
            pass_check "Disk space: ${AVAILABLE_SPACE}GB available (meets requirement)"
        elif [ "$AVAILABLE_SPACE" -ge 50 ]; then
            warn_check "Disk space: ${AVAILABLE_SPACE}GB available (below recommended 100GB+)"
        else
            fail_check "Disk space: ${AVAILABLE_SPACE}GB available (below minimum requirement)"
        fi
    else
        warn_check "Cannot check disk space (df command not available)"
    fi
    
    # Check CPU cores
    if command_exists nproc; then
        CPU_CORES=$(nproc)
        if [ "$CPU_CORES" -ge 8 ]; then
            pass_check "CPU cores: $CPU_CORES (excellent)"
        elif [ "$CPU_CORES" -ge 4 ]; then
            pass_check "CPU cores: $CPU_CORES (meets minimum requirement)"
        else
            warn_check "CPU cores: $CPU_CORES (below recommended 4+ cores)"
        fi
    else
        warn_check "Cannot check CPU cores (nproc command not available)"
    fi
}

# Check required files
check_required_files() {
    print_header "Required Files"
    
    # Check Docker Compose file
    if [ -f "docker-compose.production.yml" ]; then
        pass_check "Production Docker Compose file exists"
    else
        fail_check "docker-compose.production.yml not found"
    fi
    
    # Check environment file
    if [ -f ".env.production" ]; then
        pass_check "Production environment file exists"
        
        # Check for default passwords
        if grep -q "CHANGE_THIS" .env.production; then
            fail_check "Default passwords found in .env.production (security risk)"
        else
            pass_check "No default passwords in environment file"
        fi
    else
        fail_check ".env.production file not found"
    fi
    
    # Check SSL certificates
    if [ -d "ssl" ]; then
        if [ -f "ssl/server.crt" ] && [ -f "ssl/server.key" ]; then
            pass_check "SSL certificates are present"
        else
            warn_check "SSL certificates not found (will use self-signed)"
        fi
    else
        warn_check "SSL directory not found"
    fi
    
    # Check deployment scripts
    required_scripts=("setup-environment.sh" "deploy.sh" "test-integration.sh" "backup.sh")
    for script in "${required_scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                pass_check "Script $script exists and is executable"
            else
                warn_check "Script $script exists but is not executable"
            fi
        else
            fail_check "Script $script not found"
        fi
    done
}

# Check network connectivity
check_network() {
    print_header "Network Connectivity"
    
    # Check internet connectivity
    if command_exists curl; then
        if curl -s --max-time 5 https://google.com > /dev/null; then
            pass_check "Internet connectivity available"
        else
            fail_check "No internet connectivity"
        fi
    elif command_exists ping; then
        if ping -c 1 -W 5 8.8.8.8 > /dev/null 2>&1; then
            pass_check "Internet connectivity available"
        else
            fail_check "No internet connectivity"
        fi
    else
        warn_check "Cannot test internet connectivity"
    fi
    
    # Check DNS resolution
    if command_exists nslookup; then
        if nslookup google.com > /dev/null 2>&1; then
            pass_check "DNS resolution working"
        else
            fail_check "DNS resolution not working"
        fi
    else
        warn_check "Cannot test DNS resolution (nslookup not available)"
    fi
}

# Check port availability
check_ports() {
    print_header "Port Availability"
    
    required_ports=(80 443 3001 9090)
    
    for port in "${required_ports[@]}"; do
        if command_exists netstat; then
            if netstat -tuln | grep ":$port " > /dev/null; then
                warn_check "Port $port is already in use"
            else
                pass_check "Port $port is available"
            fi
        elif command_exists ss; then
            if ss -tuln | grep ":$port " > /dev/null; then
                warn_check "Port $port is already in use"
            else
                pass_check "Port $port is available"
            fi
        else
            warn_check "Cannot check port $port (netstat/ss not available)"
        fi
    done
}

# Check security settings
check_security() {
    print_header "Security Configuration"
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        warn_check "Running as root (not recommended for production)"
    else
        pass_check "Not running as root (good security practice)"
    fi
    
    # Check firewall
    if command_exists ufw; then
        if ufw status | grep -q "Status: active"; then
            pass_check "UFW firewall is active"
        else
            warn_check "UFW firewall is not active"
        fi
    elif command_exists firewall-cmd; then
        if systemctl is-active firewalld > /dev/null 2>&1; then
            pass_check "Firewalld is active"
        else
            warn_check "Firewalld is not active"
        fi
    else
        warn_check "No firewall detected"
    fi
    
    # Check for updates
    if command_exists apt; then
        UPDATES=$(apt list --upgradable 2>/dev/null | wc -l)
        if [ "$UPDATES" -gt 1 ]; then
            warn_check "$((UPDATES-1)) system updates available"
        else
            pass_check "System is up to date"
        fi
    elif command_exists yum; then
        if yum check-update > /dev/null 2>&1; then
            pass_check "System is up to date"
        else
            warn_check "System updates may be available"
        fi
    else
        warn_check "Cannot check for system updates"
    fi
}

# Check configuration validity
check_configuration() {
    print_header "Configuration Validation"
    
    # Check Docker Compose file syntax
    if [ -f "docker-compose.production.yml" ] && command_exists docker-compose; then
        if docker-compose -f docker-compose.production.yml config > /dev/null 2>&1; then
            pass_check "Docker Compose configuration is valid"
        else
            fail_check "Docker Compose configuration has errors"
        fi
    else
        warn_check "Cannot validate Docker Compose configuration"
    fi
    
    # Check environment file format
    if [ -f ".env.production" ]; then
        if grep -q "^[A-Z_][A-Z0-9_]*=" .env.production; then
            pass_check "Environment file format appears valid"
        else
            warn_check "Environment file format may be invalid"
        fi
    fi
}

# Generate report
generate_report() {
    print_header "Deployment Readiness Report"
    
    echo ""
    echo "Summary:"
    echo "--------"
    echo -e "${GREEN}✓ Passed: $PASS_COUNT${NC}"
    echo -e "${YELLOW}⚠ Warnings: $WARN_COUNT${NC}"
    echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
    echo ""
    
    if [ "$FAIL_COUNT" -eq 0 ]; then
        if [ "$WARN_COUNT" -eq 0 ]; then
            echo -e "${GREEN}🎉 Deployment environment is READY!${NC}"
            echo "You can proceed with deployment using ./deploy.sh"
        else
            echo -e "${YELLOW}⚠️  Deployment environment is MOSTLY READY${NC}"
            echo "Consider addressing warnings before deployment"
        fi
    else
        echo -e "${RED}❌ Deployment environment is NOT READY${NC}"
        echo "Please fix the failed checks before deployment"
        echo ""
        echo "Common fixes:"
        echo "- Install Docker: curl -fsSL https://get.docker.com | sh"
        echo "- Install Docker Compose: pip install docker-compose"
        echo "- Update passwords in .env.production"
        echo "- Free up disk space if needed"
        echo "- Configure SSL certificates"
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Fix any failed checks"
    echo "2. Address warnings if possible"
    echo "3. Run './deploy.sh' to start deployment"
    echo "4. Monitor deployment with './test-integration.sh'"
}

# Main execution
main() {
    echo "🔍 CloudPOS Deployment Verification"
    echo "=================================="
    echo ""
    
    check_docker
    check_docker_compose
    check_system_resources
    check_required_files
    check_network
    check_ports
    check_security
    check_configuration
    
    generate_report
}

# Run main function
main "$@"