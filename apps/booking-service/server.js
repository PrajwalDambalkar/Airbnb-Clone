import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import ownerBookingRoutes from './src/routes/ownerBookingRoutes.js';
import { connectProducer, disconnectProducer } from './src/kafka/producer.js';
import { connectBookingUpdateConsumer, disconnectConsumer } from './src/kafka/consumer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined');
  process.exit(1);
}

const sessionStore = MongoStore.create({
  mongoUrl: MONGODB_URI,
  collectionName: 'sessions',
  ttl: 7 * 24 * 60 * 60,
  autoRemove: 'native'
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not defined');
  process.exit(1);
}

app.use(session({
  secret: SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/'
  }
}));

app.get('/health', async (req, res) => {
  try {
    const mongoose = await import('./src/config/db.js');
    const dbStatus = mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'healthy',
      service: 'booking-service',
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

app.get('/', (req, res) => {
  res.json({
    message: 'Booking Service is running',
    service: 'booking-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/bookings/owner', ownerBookingRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize Kafka connections
    await connectProducer();
    await connectBookingUpdateConsumer(async (updateData) => {
      console.log('📥 Received booking update from Kafka:', updateData);
      // Handle booking status updates from owner-service
      // This could trigger notifications, emails, etc.
    });
    
    app.listen(PORT, () => {
      console.log(`🚀 Booking Service running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('📤 Kafka Producer: Ready to publish booking requests');
      console.log('📥 Kafka Consumer: Listening for booking updates');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await disconnectProducer();
      await disconnectConsumer();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

