# CloudPOS Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the CloudPOS system in a production environment. The system includes 8 microservices, a React frontend, and comprehensive monitoring infrastructure.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Monitoring    │    │    Backup       │
│    (Nginx)      │    │  (Prometheus)   │    │   (Automated)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Swarm / K8s Cluster                   │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Frontend      │   API Gateway   │        Microservices        │
│   (React SPA)   │   (Express)     │  ┌─────────────────────────┐ │
│                 │                 │  │ • Auth Service          │ │
│                 │                 │  │ • Inventory Service     │ │
│                 │                 │  │ • Transaction Service   │ │
│                 │                 │  │ • Payment Service       │ │
│                 │                 │  │ • Customer Service      │ │
│                 │                 │  │ • Notification Service  │ │
│                 │                 │  │ • Reporting Service     │ │
│                 │                 │  └─────────────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────────────┘
         │                       │                       │
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   PostgreSQL    │      Redis      │        MongoDB              │
│   (Primary DB)  │    (Cache)      │     (Analytics)             │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 4 cores (8 threads)
- RAM: 8GB
- Storage: 100GB SSD
- Network: 100 Mbps
- OS: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

**Recommended for Production:**
- CPU: 8 cores (16 threads)
- RAM: 16GB
- Storage: 500GB SSD (with backup storage)
- Network: 1 Gbps
- OS: Ubuntu 22.04 LTS

### Software Requirements

1. **Docker Engine** (version 20.10+)
2. **Docker Compose** (version 2.0+)
3. **Git** (for deployment scripts)
4. **SSL Certificates** (for HTTPS)
5. **Domain Name** (for production access)

### Network Requirements

**Required Ports:**
- 80/443 (HTTP/HTTPS) - Public access
- 22 (SSH) - Administrative access
- 3001 (Grafana) - Monitoring dashboard
- 9090 (Prometheus) - Metrics collection

**Internal Ports (Docker network):**
- 3000 (API Gateway)
- 3001-3007 (Microservices)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 27017 (MongoDB)

## Pre-Deployment Setup

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reboot to apply changes
sudo reboot
```

### 2. Clone Repository

```bash
git clone <your-repository-url>
cd cloud-pos-system
```

### 3. Environment Configuration

```bash
# Copy and configure environment file
cp .env.production .env
nano .env

# Update the following critical values:
# - All database passwords
# - JWT secrets
# - Payment gateway credentials
# - SMTP settings
# - Domain names
# - SSL certificate paths
```

### 4. SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**
```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/server.key
sudo chown $USER:$USER ssl/*
```

**Option B: Self-Signed (Development only)**
```bash
# Generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/server.key \
    -out ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=YourOrg/CN=yourdomain.com"
```

## Deployment Process

### 1. Environment Setup

```bash
# Run the environment setup script
./setup-environment.sh
```

This script will:
- Create necessary directories
- Set proper permissions
- Generate configurations
- Create backup and deployment scripts
- Validate environment settings

### 2. Initial Deployment

```bash
# Deploy the application
./deploy.sh
```

The deployment script will:
- Pull latest Docker images
- Stop existing services
- Start all services in correct order
- Wait for services to be ready
- Run health checks

### 3. Database Initialization

```bash
# Run database migrations and seed data
docker-compose exec api-gateway npm run migrate
docker-compose exec api-gateway npm run seed
```

### 4. Verify Deployment

```bash
# Run comprehensive integration tests
./test-integration.sh

# Check service status
docker-compose ps

# View logs
docker-compose logs --tail=50
```

## Post-Deployment Configuration

### 1. Monitoring Setup

**Access Grafana Dashboard:**
- URL: `http://your-domain:3001`
- Username: `admin`
- Password: Check `.env` file

**Import CloudPOS Dashboard:**
1. Go to Grafana → Import
2. Upload `config/grafana/dashboards/cloudpos-overview.json`
3. Configure data source as Prometheus

### 2. Backup Configuration

```bash
# Set up automated backups (cron job)
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/cloud-pos-system/backup.sh
```

### 3. Log Rotation

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/cloudpos

# Add configuration:
/var/log/cloudpos/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

### 4. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Grafana (restrict to admin IPs)
sudo ufw status
```

## Monitoring and Maintenance

### Health Checks

**Automated Health Checks:**
- API Gateway: `https://your-domain/health`
- Individual Services: Available through service discovery
- Database Health: Monitored via Prometheus

**Manual Health Verification:**
```bash
# Check all services
curl -f https://your-domain/health || echo "Health check failed"

# Check specific service
curl -f https://your-domain/api/auth/health

# View service metrics
curl https://your-domain/api/metrics
```

### Performance Monitoring

**Key Metrics to Monitor:**
- Response Time: < 200ms (95th percentile)
- Error Rate: < 0.1%
- Availability: > 99.9%
- Database Connections: < 80% of max
- Memory Usage: < 80% of allocated
- CPU Usage: < 70% average

**Alerts Configuration:**
Set up alerts in Grafana for:
- Service downtime
- High error rates
- Database connection issues
- Memory/CPU threshold breaches
- Disk space warnings

### Log Management

**Centralized Logging:**
```bash
# View aggregated logs
docker-compose logs -f

# Service-specific logs
docker-compose logs -f auth-service
docker-compose logs -f transaction-service

# Error logs only
docker-compose logs --grep "ERROR"
```

**Log Levels:**
- Production: `error` and `warn` only
- Staging: `info` level
- Development: `debug` level

## Scaling and Performance

### Horizontal Scaling

**Service Scaling:**
```bash
# Scale specific services
docker-compose up -d --scale transaction-service=3
docker-compose up -d --scale payment-service=2

# Auto-scaling with Docker Swarm
docker service update --replicas 3 cloudpos_transaction-service
```

**Database Scaling:**
- PostgreSQL: Read replicas for reporting
- Redis: Cluster mode for high availability
- MongoDB: Replica set for analytics

### Performance Optimization

**Application Level:**
- Enable Redis caching
- Optimize database queries
- Implement connection pooling
- Use CDN for static assets

**Infrastructure Level:**
- Load balancer configuration
- Database tuning
- SSD storage optimization
- Network optimization

## Security Hardening

### Application Security

1. **API Security:**
   - Rate limiting enabled
   - JWT token validation
   - Input sanitization
   - CORS configuration

2. **Database Security:**
   - Encrypted connections
   - Strong passwords
   - Regular security updates
   - Access control

3. **Network Security:**
   - HTTPS enforced
   - Firewall rules
   - VPN access for admin
   - Security headers

### Compliance

**PCI DSS Requirements:**
- Encrypted payment data
- Secure key management
- Access logging
- Regular security scans

**GDPR Compliance:**
- Data encryption
- User consent management
- Data retention policies
- Right to deletion

## Backup and Recovery

### Backup Strategy

**Automated Backups:**
- Database: Daily full backup
- Files: Daily incremental backup
- Configuration: Weekly backup
- Logs: Real-time to external storage

**Backup Script Usage:**
```bash
# Manual backup
./backup.sh

# Restore from backup
./restore.sh cloudpos_backup_20231201_020000.tar.gz
```

### Disaster Recovery

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 1 hour

**Recovery Procedures:**
1. Restore from backup
2. Update DNS if needed
3. Verify all services
4. Run integration tests
5. Notify stakeholders

## Troubleshooting

### Common Issues

**Service Won't Start:**
```bash
# Check logs
docker-compose logs service-name

# Check disk space
df -h

# Check memory
free -h

# Restart service
docker-compose restart service-name
```

**Database Connection Issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check Redis
docker-compose exec redis redis-cli ping

# Check MongoDB
docker-compose exec mongodb mongo --eval "db.runCommand('ping')"
```

**Performance Issues:**
```bash
# Check resource usage
docker stats

# Check slow queries
docker-compose exec postgres psql -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Check Redis memory
docker-compose exec redis redis-cli info memory
```

### Support Contacts

- **Technical Support:** support@yourcompany.com
- **Emergency Contact:** +1-XXX-XXX-XXXX
- **Documentation:** https://docs.yourcompany.com

## Upgrade Procedures

### Application Updates

```bash
# Pull latest code
git pull origin main

# Update services
./deploy.sh

# Run migrations
docker-compose exec api-gateway npm run migrate

# Verify deployment
./test-integration.sh
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Update SSL certificates
sudo certbot renew
```

## Performance Benchmarks

### Expected Performance Metrics

**API Performance:**
- Authentication: < 100ms
- Inventory queries: < 150ms
- Transaction processing: < 200ms
- Report generation: < 500ms

**Database Performance:**
- PostgreSQL: < 50ms average query time
- Redis: < 5ms cache retrieval
- MongoDB: < 100ms analytics queries

**System Performance:**
- Memory usage: < 70% of allocated
- CPU usage: < 60% average
- Disk I/O: < 80% utilization
- Network: < 50% bandwidth utilization

## Conclusion

This deployment guide provides comprehensive instructions for setting up and maintaining the CloudPOS system in production. Regular monitoring, maintenance, and security updates are essential for optimal performance and security.

For additional support or questions, refer to the troubleshooting section or contact technical support.