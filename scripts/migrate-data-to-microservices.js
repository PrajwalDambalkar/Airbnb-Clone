/**
 * MongoDB Data Migration Script
 * Migrates data from centralized airbnb_db to individual microservice databases
 */

const mongoose = require('mongoose');

// Connection strings
const SOURCE_DB = 'mongodb+srv://prajwald_user:Prajwal123@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority';
const TARGET_DBS = {
  properties: 'mongodb+srv://prajwald_user:Prajwal123@cluster0.y1r5ijv.mongodb.net/airbnb_properties?retryWrites=true&w=majority',
  bookings: 'mongodb+srv://prajwald_user:Prajwal123@cluster0.y1r5ijv.mongodb.net/airbnb_bookings?retryWrites=true&w=majority',
  travelers: 'mongodb+srv://prajwald_user:Prajwal123@cluster0.y1r5ijv.mongodb.net/airbnb_travelers?retryWrites=true&w=majority',
  owners: 'mongodb+srv://prajwald_user:Prajwal123@cluster0.y1r5ijv.mongodb.net/airbnb_owners?retryWrites=true&w=majority'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrateData() {
  let sourceConnection, propConnection, bookingConnection, travelerConnection, ownerConnection;

  try {
    log('\n🚀 Starting Data Migration to Microservices...', 'cyan');
    log('================================================\n', 'cyan');

    // Connect to source database
    log('📡 Connecting to source database (airbnb_db)...', 'blue');
    sourceConnection = await mongoose.createConnection(SOURCE_DB).asPromise();
    log('✅ Connected to source database\n', 'green');

    // Connect to all target databases
    log('📡 Connecting to target databases...', 'blue');
    propConnection = await mongoose.createConnection(TARGET_DBS.properties).asPromise();
    log('✅ Connected to airbnb_properties', 'green');
    
    bookingConnection = await mongoose.createConnection(TARGET_DBS.bookings).asPromise();
    log('✅ Connected to airbnb_bookings', 'green');
    
    travelerConnection = await mongoose.createConnection(TARGET_DBS.travelers).asPromise();
    log('✅ Connected to airbnb_travelers', 'green');
    
    ownerConnection = await mongoose.createConnection(TARGET_DBS.owners).asPromise();
    log('✅ Connected to airbnb_owners\n', 'green');

    // Get source collections
    const sourceDb = sourceConnection.db;
    const propertiesCol = sourceDb.collection('properties');
    const bookingsCol = sourceDb.collection('bookings');
    const usersCol = sourceDb.collection('users');
    const sessionsCol = sourceDb.collection('sessions');

    // ==========================
    // 1. Migrate Properties
    // ==========================
    log('📦 Migrating Properties...', 'yellow');
    const properties = await propertiesCol.find({}).toArray();
    if (properties.length > 0) {
      const targetPropsCol = propConnection.db.collection('properties');
      await targetPropsCol.deleteMany({}); // Clear existing
      await targetPropsCol.insertMany(properties);
      log(`✅ Migrated ${properties.length} properties to airbnb_properties`, 'green');
    } else {
      log('⚠️  No properties found to migrate', 'yellow');
    }

    // ==========================
    // 2. Migrate Bookings
    // ==========================
    log('\n📦 Migrating Bookings...', 'yellow');
    const bookings = await bookingsCol.find({}).toArray();
    if (bookings.length > 0) {
      const targetBookingsCol = bookingConnection.db.collection('bookings');
      await targetBookingsCol.deleteMany({}); // Clear existing
      await targetBookingsCol.insertMany(bookings);
      log(`✅ Migrated ${bookings.length} bookings to airbnb_bookings`, 'green');
    } else {
      log('⚠️  No bookings found to migrate', 'yellow');
    }

    // ==========================
    // 3. Migrate Users (Split by Role)
    // ==========================
    log('\n📦 Migrating Users...', 'yellow');
    const allUsers = await usersCol.find({}).toArray();
    
    // Split users by role
    const travelers = allUsers.filter(user => user.role === 'traveler');
    const owners = allUsers.filter(user => user.role === 'owner');
    const admins = allUsers.filter(user => user.role === 'admin');

    log(`   Found ${travelers.length} travelers, ${owners.length} owners, ${admins.length} admins`, 'cyan');

    // Migrate travelers
    if (travelers.length > 0) {
      const targetTravelersCol = travelerConnection.db.collection('users');
      await targetTravelersCol.deleteMany({}); // Clear existing
      await targetTravelersCol.insertMany(travelers);
      log(`   ✅ Migrated ${travelers.length} travelers to airbnb_travelers`, 'green');
    }

    // Migrate owners (+ admins can access owner service)
    if (owners.length > 0 || admins.length > 0) {
      const targetOwnersCol = ownerConnection.db.collection('users');
      await targetOwnersCol.deleteMany({}); // Clear existing
      const ownersAndAdmins = [...owners, ...admins];
      await targetOwnersCol.insertMany(ownersAndAdmins);
      log(`   ✅ Migrated ${ownersAndAdmins.length} owners/admins to airbnb_owners`, 'green');
    }

    // ==========================
    // 4. Migrate Sessions (to all DBs)
    // ==========================
    log('\n📦 Migrating Sessions...', 'yellow');
    const sessions = await sessionsCol.find({}).toArray();
    if (sessions.length > 0) {
      // Copy sessions to all microservice databases
      const sessionMigrations = [
        { name: 'airbnb_properties', connection: propConnection },
        { name: 'airbnb_bookings', connection: bookingConnection },
        { name: 'airbnb_travelers', connection: travelerConnection },
        { name: 'airbnb_owners', connection: ownerConnection }
      ];

      for (const { name, connection } of sessionMigrations) {
        const targetSessionsCol = connection.db.collection('sessions');
        await targetSessionsCol.deleteMany({}); // Clear existing
        await targetSessionsCol.insertMany(sessions);
        log(`   ✅ Migrated ${sessions.length} sessions to ${name}`, 'green');
      }
    } else {
      log('⚠️  No sessions found to migrate', 'yellow');
    }

    // ==========================
    // Summary
    // ==========================
    log('\n================================================', 'cyan');
    log('🎉 Migration Completed Successfully!', 'green');
    log('================================================', 'cyan');
    log(`\n📊 Migration Summary:`, 'blue');
    log(`   • Properties: ${properties.length} → airbnb_properties`, 'cyan');
    log(`   • Bookings: ${bookings.length} → airbnb_bookings`, 'cyan');
    log(`   • Travelers: ${travelers.length} → airbnb_travelers`, 'cyan');
    log(`   • Owners: ${owners.length + admins.length} → airbnb_owners`, 'cyan');
    log(`   • Sessions: ${sessions.length} → all databases`, 'cyan');
    log('\n✨ All microservices now have their data!', 'green');

  } catch (error) {
    log('\n❌ Migration Error:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    // Close all connections
    log('\n🔌 Closing database connections...', 'blue');
    if (sourceConnection) await sourceConnection.close();
    if (propConnection) await propConnection.close();
    if (bookingConnection) await bookingConnection.close();
    if (travelerConnection) await travelerConnection.close();
    if (ownerConnection) await ownerConnection.close();
    log('✅ All connections closed', 'green');
    log('\n👋 Migration script finished!\n', 'cyan');
  }
}

// Run the migration
migrateData();
