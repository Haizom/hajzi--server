import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import apiRoutes from './routes/index.js';
import AppError from './utils/AppError.js';

// ES6 module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development to allow images
})); // Security headers (CSP disabled for development)
// CORS configuration with support for multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://hajzi-client-u5pu.vercel.app',
  'http://localhost:5173',
  'https://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type']
}));
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Body parsing
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads with comprehensive CORS headers
app.use('/uploads', (req, res, next) => {
  // Allow all origins for development
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  // Additional static file options
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Test endpoint to check uploads directory
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, '../uploads');
  const hotelsDir = path.join(uploadsDir, 'hotels');
  const roomsDir = path.join(uploadsDir, 'rooms');
  
  try {
    const uploadsExists = fs.existsSync(uploadsDir);
    const hotelsExists = fs.existsSync(hotelsDir);
    const roomsExists = fs.existsSync(roomsDir);
    const uploadsFiles = uploadsExists ? fs.readdirSync(uploadsDir) : [];
    const hotelsFiles = hotelsExists ? fs.readdirSync(hotelsDir) : [];
    const roomsFiles = roomsExists ? fs.readdirSync(roomsDir) : [];
    
    res.json({
      uploadsDir,
      hotelsDir,
      roomsDir,
      uploadsExists,
      hotelsExists,
      roomsExists,
      uploadsFiles,
      hotelsFiles,
      roomsFiles,
      baseUrl: process.env.BASE_URL || 'http://localhost:5000'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Hajzi API is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: 'Connected',
    uploads: {
      baseUrl: process.env.BASE_URL || 'http://localhost:5000',
      uploadsPath: '/uploads',
      hotelsPath: '/uploads/hotels',
      roomsPath: '/uploads/rooms'
    },
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: process.env.FRONTEND_URL
    }
  });
});

// API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiRoutes);

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Stack:', err.stack);
  }

  // Send error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Hajzi API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
});

export default app;
