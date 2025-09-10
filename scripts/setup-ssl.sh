#!/bin/bash

# SSL Setup Script for Hajzi Backend
# This script sets up SSL certificates for HTTPS

echo "🔐 Setting up SSL certificates for Hajzi Backend..."

# Create SSL directories
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# Generate self-signed certificate (for development/testing)
echo "Generating self-signed SSL certificate..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/hajzi-backend.key \
    -out /etc/ssl/certs/hajzi-backend.crt \
    -subj "/C=YE/ST=Sana/L=Sana/O=Hajzi/OU=Backend/CN=217.171.146.67"

# Set proper permissions
sudo chmod 600 /etc/ssl/private/hajzi-backend.key
sudo chmod 644 /etc/ssl/certs/hajzi-backend.crt

echo "✅ Self-signed SSL certificate generated successfully!"
echo ""
echo "📝 IMPORTANT NOTES:"
echo "1. This is a self-signed certificate for development/testing"
echo "2. Browsers will show a security warning - this is expected"
echo "3. For production, consider using Let's Encrypt or a commercial SSL certificate"
echo ""
echo "🚀 Next steps:"
echo "1. Copy the nginx configuration: sudo cp nginx.conf.template /etc/nginx/sites-available/hajzi-backend"
echo "2. Enable the site: sudo ln -s /etc/nginx/sites-available/hajzi-backend /etc/nginx/sites-enabled/"
echo "3. Test nginx config: sudo nginx -t"
echo "4. Restart nginx: sudo systemctl restart nginx"
echo "5. Update your frontend to use: https://217.171.146.67/api/v1"
echo ""
echo "🔥 For Let's Encrypt SSL (recommended for production):"
echo "sudo apt update && sudo apt install certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d 217.171.146.67"

