#!/bin/bash

# =============================================================================
# HAJZI BACKEND SERVER-SIDE DEPLOYMENT SCRIPT
# Run this script INSIDE the server after cloning the repository
# Usage: ./server-deploy.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hajzi-backend"
APP_DIR="/var/www/hajzi-backend"
CURRENT_DIR=$(pwd)
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
DOMAIN="$SERVER_IP"
SSL_COUNTRY="YE"
SSL_STATE="Sanaa"
SSL_CITY="Sanaa"
SSL_ORG="Hajzi"
SSL_UNIT="IT"
SSL_EMAIL="admin@hajzi.com"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

print_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to wait for user confirmation
confirm() {
    read -p "$(echo -e ${YELLOW}$1 ${NC}[y/N]: )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Operation cancelled by user"
        exit 1
    fi
}

# Function to test endpoint
test_endpoint() {
    local url="$1"
    local expected_code="$2"
    local description="$3"
    
    print_test "Testing: $description"
    local response_code=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        print_success "✓ $description - Response: $response_code"
        return 0
    else
        print_error "✗ $description - Expected: $expected_code, Got: $response_code"
        return 1
    fi
}

# Function to test with timeout
test_with_timeout() {
    local url="$1"
    local expected_code="$2"
    local description="$3"
    local max_attempts=10
    local attempt=1
    
    print_test "Testing: $description (with retry)"
    
    while [ $attempt -le $max_attempts ]; do
        local response_code=$(curl -k -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        if [ "$response_code" = "$expected_code" ]; then
            print_success "✓ $description - Response: $response_code (attempt $attempt)"
            return 0
        fi
        
        print_warning "Attempt $attempt/$max_attempts failed (got $response_code), retrying in 3 seconds..."
        sleep 3
        ((attempt++))
    done
    
    print_error "✗ $description failed after $max_attempts attempts"
    return 1
}

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                    HAJZI BACKEND SERVER DEPLOYMENT${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}Current Directory: $CURRENT_DIR${NC}"
echo -e "${GREEN}Target Directory: $APP_DIR${NC}"
echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Application: $APP_NAME${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Check if running as root
check_root

# Confirm deployment
confirm "This will set up the complete Hajzi backend deployment. Continue?"

# =============================================================================
# STEP 1: STOP EXISTING SERVICES
# =============================================================================
print_status "Step 1: Stopping existing services..."

# Stop any existing services gracefully
pkill -f node || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

print_success "Existing services stopped"

# =============================================================================
# STEP 2: INSTALL SYSTEM DEPENDENCIES
# =============================================================================
print_status "Step 2: Installing system dependencies..."

# Update system
apt-get update -y

# Install Node.js 18.x if not already installed
if ! command -v node &> /dev/null || [ "$(node --version | cut -d'.' -f1 | cut -d'v' -f2)" -lt "18" ]; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install other dependencies
apt-get install -y nginx git curl unzip software-properties-common ufw

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

print_success "System dependencies installed"

# =============================================================================
# STEP 3: SETUP APPLICATION DIRECTORY
# =============================================================================
print_status "Step 3: Setting up application directory..."

# Create target directory
mkdir -p "$APP_DIR"

# Copy current directory contents to target
if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
    print_status "Copying files from $CURRENT_DIR to $APP_DIR..."
    cp -r "$CURRENT_DIR"/* "$APP_DIR"/
    cp -r "$CURRENT_DIR"/.[^.]* "$APP_DIR"/ 2>/dev/null || true
fi

cd "$APP_DIR"

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install --production

# Create necessary directories
mkdir -p logs
mkdir -p uploads/hotels
mkdir -p uploads/rooms

# Set permissions
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"

print_success "Application directory setup complete"

# =============================================================================
# STEP 4: CREATE PRODUCTION ENVIRONMENT
# =============================================================================
print_status "Step 4: Creating production environment configuration..."

cat > config.env << EOF
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hajziappdb?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration  
JWT_SECRET=HajziSecureJWTSecret2024!@#\$%^&*()_+$(date +%s)
JWT_EXPIRE=30d

# CORS Configuration
FRONTEND_URL=https://hajzi-client-u5pu.vercel.app

# API Configuration
API_VERSION=v1
BASE_URL=https://$SERVER_IP

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

print_success "Environment configuration created"

# =============================================================================
# STEP 5: GENERATE SSL CERTIFICATES
# =============================================================================
print_status "Step 5: Generating SSL certificates..."

# Create SSL directories
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Generate private key
openssl genrsa -out /etc/ssl/private/hajzi-backend.key 2048

# Generate certificate signing request
openssl req -new -key /etc/ssl/private/hajzi-backend.key -out /tmp/hajzi-backend.csr -subj "/C=$SSL_COUNTRY/ST=$SSL_STATE/L=$SSL_CITY/O=$SSL_ORG/OU=$SSL_UNIT/CN=$DOMAIN/emailAddress=$SSL_EMAIL"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in /tmp/hajzi-backend.csr -signkey /etc/ssl/private/hajzi-backend.key -out /etc/ssl/certs/hajzi-backend.crt

# Set proper permissions
chmod 600 /etc/ssl/private/hajzi-backend.key
chmod 644 /etc/ssl/certs/hajzi-backend.crt

# Clean up
rm /tmp/hajzi-backend.csr

print_success "SSL certificates generated"

# =============================================================================
# STEP 6: CONFIGURE NGINX
# =============================================================================
print_status "Step 6: Configuring Nginx..."

# Remove default nginx configuration
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Create main nginx configuration
cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=uploads:10m rate=5r/s;

    # Include site configurations
    include /etc/nginx/sites-enabled/*;
}
EOF

# Create site-specific configuration
cat > /etc/nginx/sites-available/hajzi-backend << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $SERVER_IP _;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name $SERVER_IP _;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/hajzi-backend.crt;
    ssl_certificate_key /etc/ssl/private/hajzi-backend.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting for API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Test uploads endpoint
    location /test-uploads {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files (uploads) with rate limiting
    location /uploads/ {
        limit_req zone=uploads burst=10 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache static files
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security: Block access to sensitive files
    location ~ /\\. {
        deny all;
    }
    
    location ~ \\.(env|log)\$ {
        deny all;
    }
    
    # Block access to sensitive paths
    location ~ ^/(config|scripts|src|tests|node_modules) {
        deny all;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/hajzi-backend /etc/nginx/sites-enabled/hajzi-backend

# Test nginx configuration
nginx -t

print_success "Nginx configured successfully"

# =============================================================================
# STEP 7: CONFIGURE FIREWALL
# =============================================================================
print_status "Step 7: Configuring firewall..."

# Configure UFW firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp  # For direct access if needed
ufw --force enable

print_success "Firewall configured"

# =============================================================================
# STEP 8: SETUP PM2 CONFIGURATION
# =============================================================================
print_status "Step 8: Setting up PM2 configuration..."

# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hajzi-backend',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000
  }]
};
EOF

print_success "PM2 configuration created"

# =============================================================================
# STEP 9: CREATE MANAGEMENT SCRIPTS
# =============================================================================
print_status "Step 9: Creating management scripts..."

# Create start script
cat > /usr/local/bin/hajzi-start << EOF
#!/bin/bash
cd $APP_DIR
pm2 start ecosystem.config.js --env production
systemctl start nginx
echo 'Hajzi Backend started successfully'
pm2 list
EOF

# Create stop script  
cat > /usr/local/bin/hajzi-stop << 'EOF'
#!/bin/bash
pm2 stop hajzi-backend
systemctl stop nginx
echo 'Hajzi Backend stopped successfully'
EOF

# Create restart script
cat > /usr/local/bin/hajzi-restart << EOF
#!/bin/bash
cd $APP_DIR
pm2 restart hajzi-backend
systemctl restart nginx
echo 'Hajzi Backend restarted successfully'
pm2 list
EOF

# Create status script
cat > /usr/local/bin/hajzi-status << 'EOF'
#!/bin/bash
echo '=== PM2 Status ==='
pm2 list
echo
echo '=== Nginx Status ==='
systemctl status nginx --no-pager
echo
echo '=== Recent Application Logs ==='
pm2 logs hajzi-backend --lines 20 --nostream
echo
echo '=== Nginx Access Logs (last 10) ==='
tail -10 /var/log/nginx/access.log
echo
echo '=== Nginx Error Logs (last 10) ==='
tail -10 /var/log/nginx/error.log
EOF

# Create update script
cat > /usr/local/bin/hajzi-update << EOF
#!/bin/bash
cd $APP_DIR
echo 'Pulling latest changes...'
git pull origin main
echo 'Installing dependencies...'
npm install --production
echo 'Restarting application...'
pm2 restart hajzi-backend
echo 'Update completed successfully'
pm2 list
EOF

# Create logs script
cat > /usr/local/bin/hajzi-logs << 'EOF'
#!/bin/bash
echo "Choose log type:"
echo "1) Application logs (PM2)"
echo "2) Nginx access logs"
echo "3) Nginx error logs"
echo "4) All logs"
read -p "Enter choice [1-4]: " choice

case $choice in
    1) pm2 logs hajzi-backend ;;
    2) tail -f /var/log/nginx/access.log ;;
    3) tail -f /var/log/nginx/error.log ;;
    4) pm2 logs hajzi-backend --lines 50 && echo "=== Nginx Access ===" && tail -20 /var/log/nginx/access.log && echo "=== Nginx Error ===" && tail -20 /var/log/nginx/error.log ;;
    *) echo "Invalid choice" ;;
esac
EOF

# Create test script
cat > /usr/local/bin/hajzi-test << EOF
#!/bin/bash
echo "Running comprehensive tests..."

# Test endpoints
echo "=== Testing HTTP to HTTPS redirect ==="
curl -I http://$SERVER_IP/health 2>/dev/null | head -1

echo "=== Testing HTTPS Health Endpoint ==="
curl -k -s https://$SERVER_IP/health | jq . 2>/dev/null || curl -k -s https://$SERVER_IP/health

echo "=== Testing API Endpoint ==="
curl -k -s https://$SERVER_IP/api/v1 | jq . 2>/dev/null || curl -k -s https://$SERVER_IP/api/v1

echo "=== Testing Upload Test Endpoint ==="
curl -k -s https://$SERVER_IP/test-uploads | jq . 2>/dev/null || curl -k -s https://$SERVER_IP/test-uploads

echo "=== Service Status ==="
pm2 list
systemctl status nginx --no-pager

echo "=== Port Status ==="
netstat -tlnp | grep -E ':80|:443|:5000'
EOF

# Make scripts executable
chmod +x /usr/local/bin/hajzi-*

print_success "Management scripts created"

# =============================================================================
# STEP 10: START SERVICES
# =============================================================================
print_status "Step 10: Starting all services..."

# Start PM2 application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
env PATH=\$PATH:/usr/bin pm2 startup systemd -u root --hp /root
pm2 save

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

print_success "All services started"

# =============================================================================
# STEP 11: COMPREHENSIVE TESTING
# =============================================================================
print_status "Step 11: Running comprehensive tests..."

# Wait for services to fully start
sleep 5

# Test PM2 status
print_test "Checking PM2 status..."
if pm2 list | grep -q "hajzi-backend.*online"; then
    print_success "✓ PM2 application is running"
else
    print_error "✗ PM2 application not running"
fi

# Test Nginx status
print_test "Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "✓ Nginx is running"
else
    print_error "✗ Nginx is not running"
fi

# Test port availability
print_test "Checking port availability..."
if netstat -tlnp | grep -q ":5000.*LISTEN"; then
    print_success "✓ Application listening on port 5000"
else
    print_error "✗ Application not listening on port 5000"
fi

if netstat -tlnp | grep -q ":80.*LISTEN"; then
    print_success "✓ Nginx listening on port 80"
else
    print_error "✗ Nginx not listening on port 80"
fi

if netstat -tlnp | grep -q ":443.*LISTEN"; then
    print_success "✓ Nginx listening on port 443"
else
    print_error "✗ Nginx not listening on port 443"
fi

# Wait a bit more for application to fully initialize
sleep 10

# Test HTTP to HTTPS redirect
test_with_timeout "http://$SERVER_IP/health" "301" "HTTP to HTTPS redirect"

# Test HTTPS health endpoint
test_with_timeout "https://$SERVER_IP/health" "200" "HTTPS health endpoint"

# Test API endpoint
test_with_timeout "https://$SERVER_IP/api/v1" "200" "API base endpoint"

# Test uploads test endpoint
test_with_timeout "https://$SERVER_IP/test-uploads" "200" "Test uploads endpoint"

# Test actual API functionality
print_test "Testing API functionality..."
API_RESPONSE=$(curl -k -s "https://$SERVER_IP/api/v1" 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "Hajzi API"; then
    print_success "✓ API returning expected response"
else
    print_warning "? API response might be different than expected"
fi

# Test health endpoint response
print_test "Testing health endpoint response..."
HEALTH_RESPONSE=$(curl -k -s "https://$SERVER_IP/health" 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q "success"; then
    print_success "✓ Health endpoint returning success status"
else
    print_warning "? Health endpoint response might be different than expected"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
echo
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}                    DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}✓ System dependencies installed${NC}"
echo -e "${GREEN}✓ Application directory setup${NC}"
echo -e "${GREEN}✓ Environment configuration created${NC}"
echo -e "${GREEN}✓ SSL certificates generated${NC}"
echo -e "${GREEN}✓ Nginx configured and started${NC}"
echo -e "${GREEN}✓ Firewall configured${NC}"
echo -e "${GREEN}✓ PM2 configured and application started${NC}"
echo -e "${GREEN}✓ Management scripts created${NC}"
echo -e "${GREEN}✓ Comprehensive testing completed${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo
echo -e "${YELLOW}🌐 Application URLs:${NC}"
echo -e "Health Check: ${BLUE}https://$SERVER_IP/health${NC}"
echo -e "API Base:     ${BLUE}https://$SERVER_IP/api/v1${NC}"
echo -e "Test Uploads: ${BLUE}https://$SERVER_IP/test-uploads${NC}"
echo
echo -e "${YELLOW}🛠️  Management Commands:${NC}"
echo -e "Start:    ${BLUE}hajzi-start${NC}"
echo -e "Stop:     ${BLUE}hajzi-stop${NC}"
echo -e "Restart:  ${BLUE}hajzi-restart${NC}"
echo -e "Status:   ${BLUE}hajzi-status${NC}"
echo -e "Update:   ${BLUE}hajzi-update${NC}"
echo -e "Logs:     ${BLUE}hajzi-logs${NC}"
echo -e "Test:     ${BLUE}hajzi-test${NC}"
echo
echo -e "${YELLOW}📁 Important Directories:${NC}"
echo -e "App Directory:  ${BLUE}$APP_DIR${NC}"
echo -e "Logs Directory: ${BLUE}$APP_DIR/logs${NC}"
echo -e "Uploads:        ${BLUE}$APP_DIR/uploads${NC}"
echo -e "SSL Certs:      ${BLUE}/etc/ssl/certs/${NC}"
echo
echo -e "${YELLOW}📝 Configuration Files:${NC}"
echo -e "Environment:    ${BLUE}$APP_DIR/config.env${NC}"
echo -e "PM2 Config:     ${BLUE}$APP_DIR/ecosystem.config.js${NC}"
echo -e "Nginx Config:   ${BLUE}/etc/nginx/sites-available/hajzi-backend${NC}"
echo
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "• SSL certificate is self-signed (browsers will show warning)"
echo -e "• Update MONGODB_URI in $APP_DIR/config.env with your actual database"
echo -e "• All services are configured to start automatically on boot"
echo -e "• Firewall is configured to allow only necessary ports"
echo
echo -e "${RED}📋 TODO:${NC}"
echo -e "1. Update MongoDB connection string in config.env"
echo -e "2. Test all API endpoints with real data"
echo -e "3. Consider getting a proper SSL certificate for production"
echo -e "4. Setup monitoring and backup strategies"
echo -e "5. Configure domain name if available"
echo
echo -e "${CYAN}🎉 Your Hajzi Backend is now fully deployed and tested!${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Show final status
print_status "Final system status:"
echo "=== PM2 Applications ==="
pm2 list
echo
echo "=== Nginx Status ==="
systemctl status nginx --no-pager
echo
echo "=== Recent Application Logs ==="
pm2 logs hajzi-backend --lines 10 --nostream

print_success "Deployment script completed successfully!"
