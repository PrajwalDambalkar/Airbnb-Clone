#!/usr/bin/env node

// Script to fetch real property IDs from MongoDB and update properties.csv
// Run this from the backend directory: node scripts/get_property_ids.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Property from '../models/Property.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from current directory (.env)
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please ensure .env file exists with MONGODB_URI');
  process.exit(1);
}

async function getPropertyIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📊 Fetching property IDs...');
    
    // Fetch available properties (limit to 10 for testing)
    const properties = await Property.find({ available: true })
      .select('_id property_name city')
      .limit(10)
      .lean();
    
    if (properties.length === 0) {
      console.log('⚠️  No available properties found in database');
      console.log('   Please ensure you have properties in your database');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Found ${properties.length} available properties`);
    console.log('\nProperties found:');
    properties.forEach((prop, index) => {
      console.log(`  ${index + 1}. ${prop.property_name} (${prop.city}) - ID: ${prop._id}`);
    });
    
    // Generate CSV content
    const csvHeader = 'property_id\n';
    const csvRows = properties.map(prop => prop._id.toString()).join('\n');
    const csvContent = csvHeader + csvRows;
    
    // Write to properties.csv in jmeter directory
    // __dirname is apps/backend/scripts, so go up 2 levels to Airbnb-Clone, then into jmeter
    const csvPath = join(__dirname, '..', '..', '..', 'jmeter', 'properties.csv');
    writeFileSync(csvPath, csvContent, 'utf8');
    
    console.log(`\n✅ Updated properties.csv with ${properties.length} property IDs`);
    console.log(`   File: ${csvPath}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('   Could not connect to MongoDB. Please check:');
      console.error('   - MongoDB connection string is correct');
      console.error('   - MongoDB server is running');
      console.error('   - Network connectivity');
    }
    process.exit(1);
  }
}

// Run the script
getPropertyIds();

