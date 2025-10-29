#!/bin/bash

# CloudPOS Environment Setup Script
# This script prepares the production environment for deployment

set -e

echo "🚀 CloudPOS Environment Setup Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check if Docker is installed and running
check_docker() {
    print_header "Checking Docker Installation"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_status "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_header "Checking Docker Compose"
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_status "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_header "Creating Directory Structure"
    
    directories=(
        "data/postgres"
        "data/redis"
        "data/mongodb"
        "logs"
        "backups"
        "ssl"
        "uploads"
        "config/nginx"
        "config/prometheus"
        "config/grafana"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        else
            print_status "Directory already exists: $dir"
        fi
    done
}

# Set proper permissions
set_permissions() {
    print_header "Setting Directory Permissions"
    
    # Set permissions for data directories
    chmod -R 755 data/
    chmod -R 755 logs/
    chmod -R 755 backups/
    chmod -R 755 uploads/
    
    # Secure SSL directory
    if [ -d "ssl" ]; then
        chmod 700 ssl/
        print_status "SSL directory secured"
    fi
    
    print_status "Permissions set successfully"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certs() {
    print_header "Generating SSL Certificates"
    
    if [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
        print_status "Generating self-signed SSL certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/server.key \
            -out ssl/server.crt \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
            2>/dev/null
        
        print_status "SSL certificates generated"
        print_warning "Using self-signed certificates. Replace with proper certificates for production."
    else
        print_status "SSL certificates already exist"
    fi
}

# Create nginx configuration
create_nginx_config() {
    print_header "Creating Nginx Configuration"
    
    cat > config/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        server api-gateway:3000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/ssl/certs/server.crt;
        ssl_certificate_key /etc/ssl/private/server.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Authentication routes with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            proxy_pass http://api_gateway/health;
            access_log off;
        }
    }
}
EOF
    
    print_status "Nginx configuration created"
}

# Create Prometheus configuration
create_prometheus_config() {
    print_header "Creating Prometheus Configuration"
    
    cat > config/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: /metrics

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: /metrics

  - job_name: 'inventory-service'
    static_configs:
      - targets: ['inventory-service:3002']
    metrics_path: /metrics

  - job_name: 'transaction-service'
    static_configs:
      - targets: ['transaction-service:3003']
    metrics_path: /metrics

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:3004']
    metrics_path: /metrics

  - job_name: 'customer-service'
    static_configs:
      - targets: ['customer-service:3005']
    metrics_path: /metrics

  - job_name: 'notification-service'
    static_configs:
      - targets: ['notification-service:3006']
    metrics_path: /metrics

  - job_name: 'reporting-service'
    static_configs:
      - targets: ['reporting-service:3007']
    metrics_path: /metrics

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
EOF
    
    print_status "Prometheus configuration created"
}

# Create Grafana configuration
create_grafana_config() {
    print_header "Creating Grafana Configuration"
    
    mkdir -p config/grafana/provisioning/datasources
    mkdir -p config/grafana/provisioning/dashboards
    
    # Datasource configuration
    cat > config/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Dashboard configuration
    cat > config/grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'CloudPOS Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
    
    print_status "Grafana configuration created"
}

# Check environment file
check_environment() {
    print_header "Checking Environment Configuration"
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found"
        exit 1
    fi
    
    # Check for default passwords
    if grep -q "CHANGE_THIS" .env.production; then
        print_warning "Found default passwords in .env.production"
        print_warning "Please update all CHANGE_THIS values with secure passwords"
        echo ""
        echo "Default values found:"
        grep "CHANGE_THIS" .env.production | head -5
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_status "Environment configuration checked"
}

# Create backup script
create_backup_script() {
    print_header "Creating Backup Script"
    
    cat > backup.sh << 'EOF'
#!/bin/bash

# CloudPOS Backup Script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup PostgreSQL databases
echo "Backing up PostgreSQL databases..."
docker exec postgres pg_dumpall -U cloudpos_user > "$BACKUP_DIR/$DATE/postgres_backup.sql"

# Backup MongoDB
echo "Backing up MongoDB..."
docker exec mongodb mongodump --out "/tmp/mongodb_backup_$DATE"
docker cp "mongodb:/tmp/mongodb_backup_$DATE" "$BACKUP_DIR/$DATE/mongodb_backup"

# Backup Redis (if persistent)
echo "Backing up Redis..."
docker exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb "$BACKUP_DIR/$DATE/redis_dump.rdb"

# Backup uploaded files
echo "Backing up uploaded files..."
cp -r uploads "$BACKUP_DIR/$DATE/uploads" 2>/dev/null || true

# Backup configuration
echo "Backing up configuration..."
cp -r config "$BACKUP_DIR/$DATE/config"
cp .env.production "$BACKUP_DIR/$DATE/.env.production"

# Create archive
echo "Creating archive..."
cd "$BACKUP_DIR"
tar -czf "cloudpos_backup_$DATE.tar.gz" "$DATE"
rm -rf "$DATE"

echo "Backup completed: cloudpos_backup_$DATE.tar.gz"

# Clean old backups (keep last 30 days)
find . -name "cloudpos_backup_*.tar.gz" -mtime +30 -delete
EOF
    
    chmod +x backup.sh
    print_status "Backup script created"
}

# Create deployment script
create_deployment_script() {
    print_header "Creating Deployment Script"
    
    cat > deploy.sh << 'EOF'
#!/bin/bash

# CloudPOS Deployment Script
set -e

echo "🚀 Starting CloudPOS deployment..."

# Pull latest images
echo "Pulling latest Docker images..."
docker-compose -f docker-compose.production.yml pull

# Stop existing services
echo "Stopping existing services..."
docker-compose -f docker-compose.production.yml down

# Start services
echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Run health checks
echo "Running health checks..."
./test-integration.sh --quick

echo "✅ Deployment completed successfully!"
echo ""
echo "Services are now running:"
echo "- Frontend: https://localhost"
echo "- API: https://localhost/api"
echo "- Grafana: http://localhost:3001"
echo "- Prometheus: http://localhost:9090"
EOF
    
    chmod +x deploy.sh
    print_status "Deployment script created"
}

# Main setup function
main() {
    print_header "CloudPOS Environment Setup"
    
    check_docker
    check_docker_compose
    create_directories
    set_permissions
    generate_ssl_certs
    create_nginx_config
    create_prometheus_config
    create_grafana_config
    check_environment
    create_backup_script
    create_deployment_script
    
    print_header "Setup Complete"
    
    echo ""
    print_status "Environment setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review and update .env.production with your production values"
    echo "2. Replace SSL certificates in ssl/ directory for production"
    echo "3. Run './deploy.sh' to start the application"
    echo "4. Set up automated backups with './backup.sh'"
    echo ""
    print_warning "Make sure to update all default passwords before production deployment!"
}

# Run main function
main "$@"