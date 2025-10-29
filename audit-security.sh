#!/bin/bash

# CloudPOS Production Configuration Audit Script
# This script audits the production configuration for security and best practices

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Security levels
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
INFO=0

# Function to print colored output with severity
critical() {
    CRITICAL=$((CRITICAL + 1))
    echo -e "${RED}[CRITICAL]${NC} $1"
}

high() {
    HIGH=$((HIGH + 1))
    echo -e "${RED}[HIGH]${NC} $1"
}

medium() {
    MEDIUM=$((MEDIUM + 1))
    echo -e "${YELLOW}[MEDIUM]${NC} $1"
}

low() {
    LOW=$((LOW + 1))
    echo -e "${YELLOW}[LOW]${NC} $1"
}

info() {
    INFO=$((INFO + 1))
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check environment file security
check_environment_security() {
    print_header "Environment File Security Audit"
    
    if [ ! -f ".env.production" ]; then
        critical "Production environment file not found"
        return 1
    fi
    
    # Check file permissions
    PERMS=$(stat -f "%A" .env.production 2>/dev/null || stat -c "%a" .env.production 2>/dev/null || echo "unknown")
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "400" ]; then
        info "Environment file has secure permissions ($PERMS)"
    else
        high "Environment file has insecure permissions ($PERMS). Should be 600 or 400"
    fi
    
    # Check for default passwords
    DEFAULT_PATTERNS=(
        "CHANGE_THIS"
        "password123"
        "admin123"
        "test123"
        "default"
        "changeme"
    )
    
    for pattern in "${DEFAULT_PATTERNS[@]}"; do
        if grep -qi "$pattern" .env.production; then
            critical "Default password pattern '$pattern' found in environment file"
        fi
    done
    
    # Check for weak passwords
    if grep -E "PASSWORD.*=.{1,7}$" .env.production > /dev/null; then
        high "Passwords shorter than 8 characters found"
    fi
    
    # Check JWT secret strength
    JWT_SECRET=$(grep "JWT_SECRET=" .env.production | cut -d'=' -f2 | tr -d '"' || echo "")
    if [ ${#JWT_SECRET} -lt 32 ]; then
        critical "JWT secret is too short (${#JWT_SECRET} chars). Should be 32+ characters"
    elif [ ${#JWT_SECRET} -ge 64 ]; then
        info "JWT secret has excellent length (${#JWT_SECRET} chars)"
    else
        medium "JWT secret length (${#JWT_SECRET} chars) is acceptable but could be longer"
    fi
    
    # Check for development mode
    if grep -q "NODE_ENV=development" .env.production; then
        critical "NODE_ENV set to development in production file"
    elif grep -q "NODE_ENV=production" .env.production; then
        info "NODE_ENV correctly set to production"
    else
        high "NODE_ENV not specified in environment file"
    fi
    
    # Check debug settings
    DEBUG_SETTINGS=(
        "DEBUG_ENABLED=true"
        "ENABLE_SWAGGER=true"
        "ENABLE_DOCS=true"
        "DEBUG_SQL=true"
        "CONSOLE_LOG_ENABLED=true"
    )
    
    for setting in "${DEBUG_SETTINGS[@]}"; do
        if grep -q "$setting" .env.production; then
            medium "Debug setting '$setting' enabled in production"
        fi
    done
    
    # Check SSL configuration
    if grep -q "SSL_ENABLED=true" .env.production; then
        info "SSL is enabled"
    else
        high "SSL is not enabled or not configured"
    fi
    
    # Check CORS configuration
    if grep -q "CORS_ORIGIN=.*localhost" .env.production; then
        medium "CORS configured for localhost in production"
    fi
    
    # Check for hardcoded secrets in comments
    if grep -E "#.*[Pp]assword|#.*[Ss]ecret|#.*[Kk]ey" .env.production > /dev/null; then
        low "Potential secrets found in comments"
    fi
}

# Check Docker Compose security
check_docker_security() {
    print_header "Docker Configuration Security Audit"
    
    if [ ! -f "docker-compose.production.yml" ]; then
        critical "Production Docker Compose file not found"
        return 1
    fi
    
    # Check for privileged containers
    if grep -q "privileged: true" docker-compose.production.yml; then
        high "Privileged containers found in Docker Compose"
    fi
    
    # Check for host network mode
    if grep -q "network_mode: host" docker-compose.production.yml; then
        medium "Host network mode found (reduces container isolation)"
    fi
    
    # Check for volume mounts
    if grep -q "/var/run/docker.sock" docker-compose.production.yml; then
        high "Docker socket mounted in container (security risk)"
    fi
    
    # Check for root user
    if grep -q "user: root" docker-compose.production.yml; then
        medium "Containers running as root user"
    fi
    
    # Check resource limits
    if ! grep -q "mem_limit\|cpus\|memory" docker-compose.production.yml; then
        medium "No resource limits defined for containers"
    else
        info "Resource limits are configured"
    fi
    
    # Check restart policies
    if grep -q "restart: always" docker-compose.production.yml; then
        info "Restart policies are configured"
    else
        low "No restart policies defined"
    fi
    
    # Check for latest tags
    if grep -q ":latest" docker-compose.production.yml; then
        medium "Using 'latest' image tags (not recommended for production)"
    fi
    
    # Check for exposed ports
    EXPOSED_PORTS=$(grep -E "ports:" -A 5 docker-compose.production.yml | grep -E "- \"[0-9]+:" | wc -l)
    if [ "$EXPOSED_PORTS" -gt 5 ]; then
        medium "Many ports exposed ($EXPOSED_PORTS). Consider using reverse proxy"
    fi
}

# Check SSL/TLS configuration
check_ssl_configuration() {
    print_header "SSL/TLS Configuration Audit"
    
    # Check SSL certificate files
    if [ -d "ssl" ]; then
        if [ -f "ssl/server.crt" ] && [ -f "ssl/server.key" ]; then
            info "SSL certificate files present"
            
            # Check certificate expiration
            if command -v openssl > /dev/null 2>&1; then
                EXPIRY=$(openssl x509 -in ssl/server.crt -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")
                if [ "$EXPIRY" != "unknown" ]; then
                    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
                    CURRENT_EPOCH=$(date +%s)
                    DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
                    
                    if [ "$DAYS_LEFT" -lt 30 ]; then
                        high "SSL certificate expires in $DAYS_LEFT days"
                    elif [ "$DAYS_LEFT" -lt 90 ]; then
                        medium "SSL certificate expires in $DAYS_LEFT days"
                    else
                        info "SSL certificate valid for $DAYS_LEFT more days"
                    fi
                fi
                
                # Check if self-signed
                if openssl x509 -in ssl/server.crt -noout -issuer -subject 2>/dev/null | grep -q "CN=localhost"; then
                    medium "Using self-signed SSL certificate"
                fi
                
                # Check key strength
                KEY_SIZE=$(openssl rsa -in ssl/server.key -text -noout 2>/dev/null | grep "Private-Key:" | grep -o "[0-9]*" || echo "0")
                if [ "$KEY_SIZE" -lt 2048 ]; then
                    high "SSL key size ($KEY_SIZE bits) is too weak. Use 2048+ bits"
                elif [ "$KEY_SIZE" -ge 4096 ]; then
                    info "SSL key size ($KEY_SIZE bits) is excellent"
                else
                    info "SSL key size ($KEY_SIZE bits) is acceptable"
                fi
            fi
        else
            high "SSL certificate files missing"
        fi
        
        # Check certificate permissions
        if [ -f "ssl/server.key" ]; then
            KEY_PERMS=$(stat -f "%A" ssl/server.key 2>/dev/null || stat -c "%a" ssl/server.key 2>/dev/null || echo "unknown")
            if [ "$KEY_PERMS" = "600" ] || [ "$KEY_PERMS" = "400" ]; then
                info "SSL private key has secure permissions ($KEY_PERMS)"
            else
                high "SSL private key has insecure permissions ($KEY_PERMS)"
            fi
        fi
    else
        high "SSL directory not found"
    fi
    
    # Check Nginx SSL configuration
    if [ -f "config/nginx/nginx.conf" ]; then
        if grep -q "ssl_protocols TLSv1.2 TLSv1.3" config/nginx/nginx.conf; then
            info "Secure TLS protocols configured"
        elif grep -q "ssl_protocols" config/nginx/nginx.conf; then
            medium "TLS protocols configured but may include weak versions"
        else
            medium "TLS protocols not explicitly configured"
        fi
        
        if grep -q "ssl_ciphers" config/nginx/nginx.conf; then
            info "SSL ciphers are configured"
        else
            medium "SSL ciphers not configured"
        fi
    fi
}

# Check database security
check_database_security() {
    print_header "Database Security Audit"
    
    # Check for default database passwords
    DB_PASSWORDS=(
        "postgres"
        "password"
        "admin"
        "root"
        "123456"
    )
    
    for password in "${DB_PASSWORDS[@]}"; do
        if grep -qi "PASSWORD.*$password" .env.production 2>/dev/null; then
            critical "Default database password '$password' detected"
        fi
    done
    
    # Check database connection encryption
    if grep -q "sslmode=require\|ssl=true" .env.production; then
        info "Database SSL connection configured"
    else
        medium "Database SSL connection not configured"
    fi
    
    # Check for database URLs with passwords in plaintext
    if grep -E "://[^:]+:[^@]+@" .env.production > /dev/null; then
        low "Database credentials embedded in connection URLs"
    fi
    
    # Check backup configuration
    if grep -q "BACKUP_ENABLED=true" .env.production; then
        info "Database backups are enabled"
    else
        medium "Database backups not configured"
    fi
    
    # Check backup encryption
    if grep -q "BACKUP_ENCRYPTION=true" .env.production; then
        info "Backup encryption is enabled"
    else
        medium "Backup encryption not configured"
    fi
}

# Check monitoring and logging security
check_monitoring_security() {
    print_header "Monitoring and Logging Security Audit"
    
    # Check log level
    if grep -q "LOG_LEVEL=debug" .env.production; then
        medium "Debug logging enabled in production (may expose sensitive data)"
    elif grep -q "LOG_LEVEL=error\|LOG_LEVEL=warn" .env.production; then
        info "Appropriate log level configured for production"
    fi
    
    # Check Grafana security
    if grep -q "GRAFANA_PASSWORD=admin" .env.production; then
        critical "Default Grafana password detected"
    fi
    
    # Check if metrics endpoints are protected
    if [ -f "config/nginx/nginx.conf" ]; then
        if grep -q "/metrics" config/nginx/nginx.conf; then
            if grep -A 10 "/metrics" config/nginx/nginx.conf | grep -q "auth_basic\|allow\|deny"; then
                info "Metrics endpoints appear to be protected"
            else
                medium "Metrics endpoints may be publicly accessible"
            fi
        fi
    fi
    
    # Check audit logging
    if grep -q "AUDIT_LOG_ENABLED=true" .env.production; then
        info "Audit logging is enabled"
    else
        medium "Audit logging not configured"
    fi
}

# Check network security
check_network_security() {
    print_header "Network Security Audit"
    
    # Check CORS configuration
    if grep -q "CORS_ORIGIN=\*" .env.production; then
        high "CORS allows all origins (*)"
    elif grep -q "CORS_ORIGIN=" .env.production; then
        info "CORS origins are configured"
    else
        medium "CORS configuration not found"
    fi
    
    # Check rate limiting
    if grep -q "RATE_LIMIT" .env.production; then
        info "Rate limiting is configured"
    else
        medium "Rate limiting not configured"
    fi
    
    # Check security headers in Nginx
    if [ -f "config/nginx/nginx.conf" ]; then
        SECURITY_HEADERS=(
            "X-Frame-Options"
            "X-Content-Type-Options"
            "X-XSS-Protection"
            "Strict-Transport-Security"
            "Content-Security-Policy"
        )
        
        HEADERS_FOUND=0
        for header in "${SECURITY_HEADERS[@]}"; do
            if grep -q "$header" config/nginx/nginx.conf; then
                HEADERS_FOUND=$((HEADERS_FOUND + 1))
            fi
        done
        
        if [ "$HEADERS_FOUND" -eq 5 ]; then
            info "All security headers are configured"
        elif [ "$HEADERS_FOUND" -ge 3 ]; then
            medium "Most security headers are configured ($HEADERS_FOUND/5)"
        else
            high "Few security headers configured ($HEADERS_FOUND/5)"
        fi
    fi
}

# Check deployment security
check_deployment_security() {
    print_header "Deployment Security Audit"
    
    # Check script permissions
    SCRIPTS=("deploy.sh" "backup.sh" "setup-environment.sh")
    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            PERMS=$(stat -f "%A" "$script" 2>/dev/null || stat -c "%a" "$script" 2>/dev/null || echo "unknown")
            if [ "$PERMS" = "755" ] || [ "$PERMS" = "750" ]; then
                info "Script $script has appropriate permissions ($PERMS)"
            else
                low "Script $script permissions may be too permissive ($PERMS)"
            fi
        fi
    done
    
    # Check for secrets in version control
    if [ -d ".git" ]; then
        if git ls-files | grep -E "\.env$|\.env\.production$" > /dev/null 2>&1; then
            critical "Environment files are tracked in version control"
        else
            info "Environment files are not tracked in version control"
        fi
        
        if [ -f ".gitignore" ]; then
            if grep -q "\.env" .gitignore; then
                info ".env files are ignored by git"
            else
                medium ".env files not explicitly ignored by git"
            fi
        fi
    fi
    
    # Check backup security
    if [ -d "backups" ]; then
        BACKUP_PERMS=$(stat -f "%A" backups 2>/dev/null || stat -c "%a" backups 2>/dev/null || echo "unknown")
        if [ "$BACKUP_PERMS" = "700" ] || [ "$BACKUP_PERMS" = "750" ]; then
            info "Backup directory has secure permissions ($BACKUP_PERMS)"
        else
            medium "Backup directory permissions could be more restrictive ($BACKUP_PERMS)"
        fi
    fi
}

# Generate security report
generate_security_report() {
    print_header "Security Audit Summary"
    
    TOTAL_ISSUES=$((CRITICAL + HIGH + MEDIUM + LOW))
    
    echo ""
    echo "Security Issues Summary:"
    echo "========================"
    echo -e "${RED}Critical: $CRITICAL${NC}"
    echo -e "${RED}High:     $HIGH${NC}"
    echo -e "${YELLOW}Medium:   $MEDIUM${NC}"
    echo -e "${YELLOW}Low:      $LOW${NC}"
    echo -e "${GREEN}Info:     $INFO${NC}"
    echo ""
    echo "Total Issues: $TOTAL_ISSUES"
    echo ""
    
    # Security score calculation
    SECURITY_SCORE=$(( 100 - (CRITICAL * 25) - (HIGH * 10) - (MEDIUM * 5) - (LOW * 2) ))
    if [ "$SECURITY_SCORE" -lt 0 ]; then
        SECURITY_SCORE=0
    fi
    
    echo "Security Score: $SECURITY_SCORE/100"
    
    if [ "$CRITICAL" -gt 0 ]; then
        echo -e "${RED}❌ CRITICAL SECURITY ISSUES FOUND${NC}"
        echo "Do NOT deploy to production until critical issues are resolved!"
    elif [ "$HIGH" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  HIGH PRIORITY SECURITY ISSUES FOUND${NC}"
        echo "Address high priority issues before production deployment"
    elif [ "$MEDIUM" -gt 0 ]; then
        echo -e "${YELLOW}🔶 MEDIUM PRIORITY SECURITY ISSUES FOUND${NC}"
        echo "Consider addressing medium priority issues for better security"
    else
        echo -e "${GREEN}✅ NO CRITICAL OR HIGH SECURITY ISSUES FOUND${NC}"
        echo "Configuration appears secure for production deployment"
    fi
    
    echo ""
    echo "Recommendations:"
    echo "=================="
    
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        echo "1. 🔴 Address all critical and high priority issues immediately"
        echo "2. 📋 Review security checklist before deployment"
        echo "3. 🔍 Run security scan again after fixes"
    fi
    
    if [ "$MEDIUM" -gt 0 ]; then
        echo "4. 🔶 Plan to address medium priority issues in next maintenance window"
    fi
    
    echo "5. 📊 Set up continuous security monitoring"
    echo "6. 🔄 Schedule regular security audits"
    echo "7. 📚 Review security documentation and best practices"
    
    echo ""
    echo "Additional Security Measures:"
    echo "=============================="
    echo "• Enable Web Application Firewall (WAF)"
    echo "• Set up intrusion detection system (IDS)"
    echo "• Configure automated security scanning"
    echo "• Implement security incident response plan"
    echo "• Regular penetration testing"
    echo "• Staff security training"
}

# Main execution
main() {
    echo "🔒 CloudPOS Production Security Audit"
    echo "====================================="
    echo ""
    
    check_environment_security
    check_docker_security
    check_ssl_configuration
    check_database_security
    check_monitoring_security
    check_network_security
    check_deployment_security
    
    generate_security_report
}

# Run main function
main "$@"