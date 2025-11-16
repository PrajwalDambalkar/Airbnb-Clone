// test-mongodb.js - Test MongoDB connection
import { connectDB } from './config/mongodb.js';

async function testMongoDB() {
  console.log('🧪 Testing MongoDB Atlas connection...\n');
  
  try {
    await connectDB();
    console.log('\n✅ SUCCESS! MongoDB Atlas is connected and ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED! Could not connect to MongoDB Atlas.');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testMongoDB();

