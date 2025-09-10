# HTTPS Deployment Guide for Hajzi Backend

## Problem
Your frontend is hosted on HTTPS (Vercel) but your backend is running on HTTP, causing Mixed Content errors that block API requests.

## Solution Overview
Configure your backend to serve HTTPS traffic by:
1. Setting up SSL certificates
2. Configuring nginx as a reverse proxy
3. Updating environment variables
4. Updating frontend API endpoints

## Quick Fix Options

### Option 1: Use ngrok (Fastest for testing)
```bash
# Install ngrok: https://ngrok.com/download
# Run your backend on port 5000
npm start

# In another terminal:
ngrok http 5000
```
This will give you an HTTPS URL like `https://abc123.ngrok.io` - use this in your frontend instead of `http://217.171.146.67:5000`

### Option 2: Deploy to a Platform with SSL (Recommended)
Deploy your backend to:
- **Railway**: Built-in SSL, easy deployment
- **Heroku**: Free tier with SSL
- **DigitalOcean App Platform**: Managed hosting with SSL
- **Vercel**: Can also host Node.js backends

### Option 3: Configure SSL on Your Server (Production)

#### Step 1: Generate SSL Certificate
```bash
# On Ubuntu/Debian server
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh
```

#### Step 2: Configure Nginx
```bash
# Copy nginx configuration
sudo cp nginx.conf.template /etc/nginx/sites-available/hajzi-backend

# Enable the site
sudo ln -s /etc/nginx/sites-available/hajzi-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### Step 3: Update Environment
```bash
# Use production environment
cp config.production.env config.env

# Or manually update:
# BASE_URL=https://217.171.146.67
# FRONTEND_URL=https://hajzi-client-u5pu.vercel.app
```

#### Step 4: Restart Your Application
```bash
# If using PM2
npm run pm2:restart

# Or regular restart
npm start
```

## Frontend Changes Required

Update your frontend API base URL from:
```javascript
// OLD
const API_BASE_URL = 'http://217.171.146.67:5000/api/v1';

// NEW (choose one based on your solution)
const API_BASE_URL = 'https://217.171.146.67/api/v1';           // Option 3
const API_BASE_URL = 'https://abc123.ngrok.io/api/v1';         // Option 1
const API_BASE_URL = 'https://your-app.railway.app/api/v1';    // Option 2
```

## Testing

1. **Check health endpoint:**
   ```bash
   curl -k https://217.171.146.67/health
   ```

2. **Test API endpoint:**
   ```bash
   curl -k https://217.171.146.67/api/v1/auth/login
   ```

3. **Verify CORS:**
   ```bash
   curl -k -H "Origin: https://hajzi-client-u5pu.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS https://217.171.146.67/api/v1/auth/login
   ```

## Security Notes

- The nginx configuration includes security headers
- CORS is configured for your specific frontend domain
- Rate limiting is enabled
- For production, consider using Let's Encrypt for free SSL certificates:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d 217.171.146.67
  ```

## Troubleshooting

### Certificate Warnings
If using self-signed certificates, browsers will show warnings. This is normal for development.

### CORS Errors
Ensure your frontend domain is added to `allowedOrigins` in `src/server.js`.

### Port Issues
Make sure port 443 (HTTPS) is open in your firewall:
```bash
sudo ufw allow 443
sudo ufw allow 80  # For HTTP redirect
```

## File Changes Made

1. **nginx.conf.template**: Added HTTPS configuration with SSL
2. **config.production.env**: Updated BASE_URL to HTTPS
3. **src/server.js**: Enhanced CORS configuration
4. **scripts/setup-ssl.sh**: SSL certificate generation script
5. **scripts/setup-ssl.bat**: Windows SSL setup instructions

## Next Steps

1. Choose one of the quick fix options above
2. Update your frontend to use the new HTTPS endpoint
3. Test all API endpoints
4. For production, set up proper SSL certificates with Let's Encrypt

Your backend is now configured for HTTPS! 🎉

