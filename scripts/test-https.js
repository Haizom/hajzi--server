#!/usr/bin/env node

import https from 'https';
import http from 'http';

// Test script to verify HTTPS configuration
console.log('🔍 Testing HTTPS configuration for Hajzi Backend...\n');

// Test endpoints
const endpoints = [
  { name: 'Health Check (HTTP)', url: 'http://217.171.146.67:5000/health' },
  { name: 'Health Check (HTTPS)', url: 'https://217.171.146.67/health' },
  { name: 'API Endpoint (HTTPS)', url: 'https://217.171.146.67/api/v1/auth/login' }
];

// Function to test an endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const isHttps = endpoint.url.startsWith('https');
    const client = isHttps ? https : http;
    
    console.log(`Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    const options = {
      method: 'GET',
      timeout: 5000,
      rejectUnauthorized: false // Allow self-signed certificates
    };
    
    const req = client.get(endpoint.url, options, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`📊 Response: ${JSON.stringify(parsed, null, 2)}`);
        } catch (e) {
          console.log(`📊 Response: ${data}`);
        }
        console.log('---\n');
        resolve({ success: true, status: res.statusCode });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log('⏰ Request timed out');
      console.log('---\n');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Test CORS preflight request
function testCORS() {
  return new Promise((resolve) => {
    console.log('Testing: CORS Preflight Request');
    console.log('URL: https://217.171.146.67/api/v1/auth/login');
    
    const options = {
      hostname: '217.171.146.67',
      port: 443,
      path: '/api/v1/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://hajzi-client-u5pu.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      },
      rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
      console.log(`✅ CORS Status: ${res.statusCode}`);
      console.log(`📋 CORS Headers:`);
      console.log(`   Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
      console.log(`   Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
      console.log(`   Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
      console.log('---\n');
      resolve({ success: true, status: res.statusCode });
    });
    
    req.on('error', (error) => {
      console.log(`❌ CORS Error: ${error.message}`);
      console.log('---\n');
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Starting endpoint tests...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('🌐 Testing CORS configuration...\n');
  await testCORS();
  
  console.log('✨ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. If HTTPS tests fail, run the SSL setup script');
  console.log('2. If HTTP works but HTTPS doesn\'t, check nginx configuration');
  console.log('3. Update your frontend to use the working HTTPS endpoint');
}

runTests().catch(console.error);

