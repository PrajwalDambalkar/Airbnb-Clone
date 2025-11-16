// server.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import { connectDB, testConnection } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env file with your MongoDB connection string');
  process.exit(1);
}

// Initialize MongoDB session store
const sessionStore = MongoStore.create({
  mongoUrl: MONGODB_URI,
  collectionName: 'sessions',
  ttl: 7 * 24 * 60 * 60, // 7 days
  autoRemove: 'native'
});

// CORS Middleware - Must be first!
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration with MongoDB
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not defined in environment variables');
  console.error('Please add SESSION_SECRET to your .env file');
  process.exit(1);
}

app.use(session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: 'lax',
    path: '/'
  },
  proxy: false
}));

// Session debugging middleware
app.use((req, res, next) => {
  if (req.path.includes('/api/auth')) {
    console.log(`📍 ${req.method} ${req.path}`);
    console.log(`   Session ID: ${req.sessionID || 'none'}`);
    console.log(`   User ID: ${req.session?.userId || 'none'}`);
    console.log(`   Has Cookie Header: ${!!req.headers.cookie}`);
  }
  next();
});

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Airbnb Clone API is running!',
    database: 'MongoDB Atlas',
    session: req.session.id ? 'Active' : 'Inactive',
    sessionData: {
      id: req.sessionID,
      hasUser: !!req.session.user,
      userId: req.session.userId
    }
  });
});

// Debug session endpoint
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: {
      cookie: req.session.cookie,
      user: req.session.user,
      userId: req.session.userId,
      userRole: req.session.userRole
    }
  });
});

// Health check route
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = await import('./config/db.js');
    const dbStatus = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Import routes
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/propertyRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import ownerBookingRoutes from './routes/ownerBookingRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/bookings/owner', ownerBookingRoutes);
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: MongoDB Atlas`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();