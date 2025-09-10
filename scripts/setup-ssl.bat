@echo off
REM SSL Setup Script for Hajzi Backend (Windows)
REM This script provides instructions for setting up SSL on Windows

echo 🔐 SSL Setup Instructions for Hajzi Backend (Windows)
echo.
echo Since you're on Windows, you have a few options:
echo.
echo 📋 OPTION 1: Use a reverse proxy service like ngrok or cloudflared
echo ----------------------------------------
echo 1. Install ngrok: https://ngrok.com/download
echo 2. Run: ngrok http 5000
echo 3. Use the HTTPS URL provided by ngrok
echo.
echo 📋 OPTION 2: Deploy to a cloud service with built-in SSL
echo ----------------------------------------
echo Consider deploying to:
echo - Heroku (free tier with SSL)
echo - Railway (has SSL support)
echo - DigitalOcean App Platform
echo - AWS Elastic Beanstalk
echo.
echo 📋 OPTION 3: Use Cloudflare for SSL termination
echo ----------------------------------------
echo 1. Sign up for Cloudflare (free plan available)
echo 2. Add your domain to Cloudflare
echo 3. Enable SSL/TLS encryption
echo 4. Use Cloudflare's edge certificates
echo.
echo 📋 OPTION 4: Generate self-signed certificate (Windows)
echo ----------------------------------------
echo If you have OpenSSL installed on Windows:
echo.
echo mkdir C:\ssl\certs
echo mkdir C:\ssl\private
echo.
echo openssl req -x509 -nodes -days 365 -newkey rsa:2048 ^
echo     -keyout C:\ssl\private\hajzi-backend.key ^
echo     -out C:\ssl\certs\hajzi-backend.crt ^
echo     -subj "/C=YE/ST=Sana/L=Sana/O=Hajzi/OU=Backend/CN=217.171.146.67"
echo.
echo 🚀 Quick Solution: Update your frontend to use ngrok HTTPS URL
echo Example: https://abc123.ngrok.io/api/v1 instead of http://217.171.146.67:5000/api/v1
echo.
pause

