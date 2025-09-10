#!/bin/bash

# =============================================================================
# HAJZI BACKEND DEPLOYMENT SCRIPT
# One-script deployment for complete server setup
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="217.171.146.67"
SERVER_PASSWORD="Odm0ChQg4t61QZx7Y0"
REPO_URL="https://github.com/Haizom/hajzi--server.git"
APP_NAME="hajzi-backend"
DOMAIN="$SERVER_IP"
SSL_COUNTRY="YE"
SSL_STATE="Sanaa"
SSL_CITY="Sanaa"
SSL_ORG="Hajzi"
SSL_UNIT="IT"
SSL_EMAIL="admin@hajzi.com"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}                    HAJZI BACKEND DEPLOYMENT SCRIPT${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}Server IP: $SERVER_IP${NC}"
echo -e "${GREEN}Repository: $REPO_URL${NC}"
echo -e "${GREEN}Application: $APP_NAME${NC}"
echo -e "${BLUE}==============================================================================${NC}"

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

# Function to execute commands on remote server
execute_remote() {
    local command="$1"
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "$command"
}

# Function to upload file to remote server
upload_file() {
    local local_file="$1"
    local remote_path="$2"
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$local_file" root@$SERVER_IP:"$remote_path"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass is required but not installed."
    echo "Please install sshpass:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install sshpass"
    echo "  CentOS/RHEL: yum install sshpass"
    exit 1
fi

print_status "Starting deployment process..."

# =============================================================================
# STEP 1: CLEAN SERVER AND INSTALL DEPENDENCIES
# =============================================================================
print_status "Step 1: Cleaning server and installing dependencies..."

execute_remote "
# Stop any existing services
pkill -f node || true
pm2 stop all || true
pm2 delete all || true
systemctl stop nginx || true

# Remove existing application
rm -rf /var/www/hajzi-backend
rm -rf /root/hajzi-backend
rm -rf /home/hajzi-backend

# Update system
apt-get update -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install other dependencies
apt-get install -y nginx git curl unzip software-properties-common ufw

# Install PM2 globally
npm install -g pm2

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 5000
ufw --force enable

print 'Dependencies installed successfully'
"

# =============================================================================
# STEP 2: CLONE AND SETUP APPLICATION
# =============================================================================
print_status "Step 2: Cloning repository and setting up application..."

execute_remote "
# Create application directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone $REPO_URL hajzi-backend
cd hajzi-backend

# Install npm dependencies
npm install --production

# Create logs directory
mkdir -p logs
mkdir -p uploads/hotels
mkdir -p uploads/rooms

# Set permissions
chown -R www-data:www-data /var/www/hajzi-backend
chmod -R 755 /var/www/hajzi-backend

print 'Repository cloned and dependencies installed'
"

# =============================================================================
# STEP 3: CREATE PRODUCTION ENVIRONMENT FILE
# =============================================================================
print_status "Step 3: Creating production environment configuration..."

execute_remote "
cd /var/www/hajzi-backend

# Create production environment file
cat > config.env << 'EOF'
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hajziappdb?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration  
JWT_SECRET=HajziSecureJWTSecret2024!@#$%^&*()_+
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

print 'Environment configuration created'
"

# =============================================================================
# STEP 4: GENERATE SSL CERTIFICATES
# =============================================================================
print_status "Step 4: Generating SSL certificates..."

execute_remote "
# Create SSL directories
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Generate private key
openssl genrsa -out /etc/ssl/private/hajzi-backend.key 2048

# Generate certificate signing request
openssl req -new -key /etc/ssl/private/hajzi-backend.key -out /tmp/hajzi-backend.csr -subj \"/C=$SSL_COUNTRY/ST=$SSL_STATE/L=$SSL_CITY/O=$SSL_ORG/OU=$SSL_UNIT/CN=$DOMAIN/emailAddress=$SSL_EMAIL\"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in /tmp/hajzi-backend.csr -signkey /etc/ssl/private/hajzi-backend.key -out /etc/ssl/certs/hajzi-backend.crt

# Set proper permissions
chmod 600 /etc/ssl/private/hajzi-backend.key
chmod 644 /etc/ssl/certs/hajzi-backend.crt

# Clean up
rm /tmp/hajzi-backend.csr

print 'SSL certificates generated'
"

# =============================================================================
# STEP 5: CONFIGURE NGINX
# =============================================================================
print_status "Step 5: Configuring Nginx..."

execute_remote "
# Remove default nginx configuration
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Create Nginx configuration
cat > /etc/nginx/sites-available/hajzi-backend << 'EOF'
# Complete nginx configuration for Hajzi Backend with HTTPS
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Rate limiting zone (must be in http block)
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $SERVER_IP;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server configuration
    server {
        listen 443 ssl http2;
        server_name $SERVER_IP;

        # SSL Configuration
        ssl_certificate /etc/ssl/certs/hajzi-backend.crt;
        ssl_certificate_key /etc/ssl/private/hajzi-backend.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options \"SAMEORIGIN\" always;
        add_header X-XSS-Protection \"1; mode=block\" always;
        add_header X-Content-Type-Options \"nosniff\" always;
        add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
        add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'\" always;
        add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        # API routes
        location /api/ {
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

        # Health check
        location /health {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # Static files (uploads)
        location /uploads/ {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Cache static files
            expires 1y;
            add_header Cache-Control \"public, immutable\";
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

        # Security: Block access to sensitive files
        location ~ /\\. {
            deny all;
        }
        
        location ~ \\.(env|log)\$ {
            deny all;
        }
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/hajzi-backend /etc/nginx/sites-enabled/hajzi-backend

# Test nginx configuration
nginx -t

print 'Nginx configured successfully'
"

# =============================================================================
# STEP 6: SETUP PM2 CONFIGURATION
# =============================================================================
print_status "Step 6: Setting up PM2 configuration..."

execute_remote "
cd /var/www/hajzi-backend

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
    min_uptime: '10s'
  }]
};
EOF

print 'PM2 configuration created'
"

# =============================================================================
# STEP 7: START SERVICES
# =============================================================================
print_status "Step 7: Starting all services..."

execute_remote "
cd /var/www/hajzi-backend

# Start PM2 application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Check service status
echo '=== PM2 Status ==='
pm2 list

echo '=== Nginx Status ==='
systemctl status nginx --no-pager

echo '=== Application Logs ==='
pm2 logs hajzi-backend --lines 10

print 'All services started successfully'
"

# =============================================================================
# STEP 8: CREATE MANAGEMENT SCRIPTS
# =============================================================================
print_status "Step 8: Creating management scripts..."

execute_remote "
# Create start script
cat > /usr/local/bin/hajzi-start << 'EOF'
#!/bin/bash
cd /var/www/hajzi-backend
pm2 start ecosystem.config.js --env production
systemctl start nginx
echo 'Hajzi Backend started successfully'
EOF

# Create stop script  
cat > /usr/local/bin/hajzi-stop << 'EOF'
#!/bin/bash
pm2 stop hajzi-backend
systemctl stop nginx
echo 'Hajzi Backend stopped successfully'
EOF

# Create restart script
cat > /usr/local/bin/hajzi-restart << 'EOF'
#!/bin/bash
cd /var/www/hajzi-backend
pm2 restart hajzi-backend
systemctl restart nginx
echo 'Hajzi Backend restarted successfully'
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
echo '=== Recent Logs ==='
pm2 logs hajzi-backend --lines 20
EOF

# Create update script
cat > /usr/local/bin/hajzi-update << 'EOF'
#!/bin/bash
cd /var/www/hajzi-backend
echo 'Pulling latest changes...'
git pull origin main
echo 'Installing dependencies...'
npm install --production
echo 'Restarting application...'
pm2 restart hajzi-backend
echo 'Update completed successfully'
EOF

# Make scripts executable
chmod +x /usr/local/bin/hajzi-*

print 'Management scripts created'
"

# =============================================================================
# STEP 9: VERIFY DEPLOYMENT
# =============================================================================
print_status "Step 9: Verifying deployment..."

sleep 10  # Wait for services to fully start

# Test HTTP redirect
print_status "Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP/health || echo "Failed")
if [ "$HTTP_RESPONSE" = "301" ]; then
    print_status "✓ HTTP to HTTPS redirect working"
else
    print_warning "✗ HTTP redirect test returned: $HTTP_RESPONSE"
fi

# Test HTTPS health endpoint  
print_status "Testing HTTPS health endpoint..."
HTTPS_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://$SERVER_IP/health || echo "Failed")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    print_status "✓ HTTPS health endpoint working"
else
    print_warning "✗ HTTPS health test returned: $HTTPS_RESPONSE"
fi

# Test API endpoint
print_status "Testing API endpoint..."
API_RESPONSE=$(curl -k -s -o /dev/null -w "%{http_code}" https://$SERVER_IP/api/v1 || echo "Failed")
if [ "$API_RESPONSE" = "200" ]; then
    print_status "✓ API endpoint working"
else
    print_warning "✗ API test returned: $API_RESPONSE"
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}                    DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}✓ Server cleaned and dependencies installed${NC}"
echo -e "${GREEN}✓ Repository cloned and application setup${NC}"
echo -e "${GREEN}✓ Environment configuration created${NC}"
echo -e "${GREEN}✓ SSL certificates generated${NC}"
echo -e "${GREEN}✓ Nginx configured and started${NC}"
echo -e "${GREEN}✓ PM2 configured and application started${NC}"
echo -e "${GREEN}✓ Management scripts created${NC}"
echo -e "${GREEN}✓ Deployment verified${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo
echo -e "${YELLOW}Application URLs:${NC}"
echo -e "Health Check: ${BLUE}https://$SERVER_IP/health${NC}"
echo -e "API Base:     ${BLUE}https://$SERVER_IP/api/v1${NC}"
echo -e "Test Uploads: ${BLUE}https://$SERVER_IP/test-uploads${NC}"
echo
echo -e "${YELLOW}Management Commands:${NC}"
echo -e "Start:    ${BLUE}hajzi-start${NC}"
echo -e "Stop:     ${BLUE}hajzi-stop${NC}"
echo -e "Restart:  ${BLUE}hajzi-restart${NC}"
echo -e "Status:   ${BLUE}hajzi-status${NC}"
echo -e "Update:   ${BLUE}hajzi-update${NC}"
echo
echo -e "${YELLOW}SSH Access:${NC}"
echo -e "Command:  ${BLUE}ssh root@$SERVER_IP${NC}"
echo -e "Password: ${BLUE}$SERVER_PASSWORD${NC}"
echo
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "• SSL certificate is self-signed (browsers will show warning)"
echo -e "• Update MONGODB_URI in /var/www/hajzi-backend/config.env with your actual database"
echo -e "• Application logs are in /var/www/hajzi-backend/logs/"
echo -e "• PM2 logs can be viewed with: pm2 logs hajzi-backend"
echo
echo -e "${RED}TODO:${NC}"
echo -e "1. Update MongoDB connection string in config.env"
echo -e "2. Test all API endpoints"
echo -e "3. Consider getting a proper SSL certificate for production"
echo -e "4. Setup monitoring and backup strategies"
echo -e "${BLUE}==============================================================================${NC}"

print_status "Deployment script completed successfully!"
