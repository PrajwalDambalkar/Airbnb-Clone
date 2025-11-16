// scripts/seedMongoDB.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Define schemas inline
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['traveler', 'owner'] },
  phone_number: String,
  city: String,
  state: String,
  country: String,
  profile_picture: String,
  created_at: { type: Date, default: Date.now }
});

const propertySchema = new mongoose.Schema({
  property_name: String,
  property_type: String,
  description: String,
  address: String,
  city: String,
  state: String,
  country: String,
  zipcode: String,
  bedrooms: Number,
  bathrooms: Number,
  max_guests: Number,
  price_per_night: String,
  cleaning_fee: String,
  service_fee: String,
  amenities: [String],
  images: [String],
  available: { type: Boolean, default: true },
  owner_id: mongoose.Schema.Types.ObjectId,
  owner_name: String,
  owner_email: String,
  owner_profile_picture: String,
  rating: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Property = mongoose.model('Property', propertySchema);

const sampleUsers = [
  {
    name: 'John Traveler',
    email: 'traveler@test.com',
    password: 'password123',
    role: 'traveler',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    phone_number: '555-0101'
  },
  {
    name: 'Jane Owner',
    email: 'owner@test.com',
    password: 'password123',
    role: 'owner',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    phone_number: '555-0102'
  },
  {
    name: 'Bob Smith',
    email: 'bob@test.com',
    password: 'password123',
    role: 'owner',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    phone_number: '555-0103'
  }
];

const sampleProperties = [
  {
    property_name: 'Beachfront Paradise in Santa Monica',
    property_type: 'house',
    description: 'Spacious beachfront guesthouse with modern amenities and ocean views. Perfect for families and groups.',
    address: '123 Ocean Drive',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    zipcode: '90401',
    bedrooms: 4,
    bathrooms: 3,
    max_guests: 8,
    price_per_night: '377',
    cleaning_fee: '50',
    service_fee: '30',
    amenities: ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'beach_access', 'hot_tub'],
    images: ['/images/property1.jpg', '/images/property2.jpg'],
    available: true,
    rating: 4.8
  },
  {
    property_name: 'Modern Loft in Downtown LA',
    property_type: 'apartment',
    description: 'Cozy private room in a modern apartment with great city views and easy access to attractions.',
    address: '456 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    zipcode: '90028',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    price_per_night: '115',
    cleaning_fee: '25',
    service_fee: '15',
    amenities: ['wifi', 'parking', 'kitchen', 'air_conditioning', 'tv'],
    images: ['/images/property3.jpg'],
    available: true,
    rating: 4.5
  },
  {
    property_name: 'Charming Family Home in Norwalk',
    property_type: 'house',
    description: 'Charming family home with spacious backyard and modern interiors. Great for families.',
    address: '789 Main Street',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    zipcode: '90650',
    bedrooms: 3,
    bathrooms: 2.5,
    max_guests: 6,
    price_per_night: '257',
    cleaning_fee: '40',
    service_fee: '25',
    amenities: ['wifi', 'parking', 'kitchen', 'air_conditioning', 'washer', 'dryer', 'backyard'],
    images: ['/images/property4.jpg', '/images/property5.jpg'],
    available: true,
    rating: 4.7
  },
  {
    property_name: 'Coastal Retreat in San Diego',
    property_type: 'house',
    description: 'Beautiful coastal home with panoramic ocean views and private patio. Perfect for a relaxing getaway.',
    address: '321 Pacific Coast Hwy',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    zipcode: '92101',
    bedrooms: 3,
    bathrooms: 2.5,
    max_guests: 7,
    price_per_night: '388',
    cleaning_fee: '55',
    service_fee: '35',
    amenities: ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'ocean_view', 'bbq_grill'],
    images: ['/images/property6.jpg', '/images/property7.jpg'],
    available: true,
    rating: 4.9
  },
  {
    property_name: 'Luxury Villa in La Jolla',
    property_type: 'villa',
    description: 'Luxury beachfront villa with private beach access and infinity pool. Ultimate luxury experience.',
    address: '555 Coast Boulevard',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    zipcode: '92037',
    bedrooms: 5,
    bathrooms: 4,
    max_guests: 10,
    price_per_night: '650',
    cleaning_fee: '100',
    service_fee: '60',
    amenities: ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'beach_access', 'hot_tub', 'gym', 'ocean_view'],
    images: ['/images/property8.jpg', '/images/property9.jpg'],
    available: true,
    rating: 5.0
  },
  {
    property_name: 'Downtown Condo in Gaslamp Quarter',
    property_type: 'condo',
    description: 'Modern condo in the heart of Gaslamp Quarter with rooftop access and city views.',
    address: '888 Fifth Avenue',
    city: 'San Diego',
    state: 'CA',
    country: 'United States',
    zipcode: '92101',
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
    price_per_night: '275',
    cleaning_fee: '45',
    service_fee: '25',
    amenities: ['wifi', 'parking', 'kitchen', 'air_conditioning', 'elevator', 'rooftop_access', 'gym'],
    images: ['/images/property10.jpg'],
    available: true,
    rating: 4.6
  },
  {
    property_name: 'Cozy Beach House in Long Beach',
    property_type: 'house',
    description: 'Charming beach house with vintage decor and cozy atmosphere. Steps from the beach.',
    address: '234 Beach Avenue',
    city: 'Los Angeles',
    state: 'CA',
    country: 'United States',
    zipcode: '90803',
    bedrooms: 2,
    bathrooms: 1.5,
    max_guests: 4,
    price_per_night: '205',
    cleaning_fee: '35',
    service_fee: '20',
    amenities: ['wifi', 'parking', 'kitchen', 'air_conditioning', 'beach_access'],
    images: ['/images/property11.jpg'],
    available: true,
    rating: 4.4
  },
  {
    property_name: 'Mountain Cabin Retreat',
    property_type: 'cabin',
    description: 'Peaceful cabin in the mountains, perfect for nature lovers and skiing enthusiasts.',
    address: '456 Mountain Road',
    city: 'Lake Tahoe',
    state: 'CA',
    country: 'United States',
    zipcode: '96150',
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    price_per_night: '180',
    cleaning_fee: '40',
    service_fee: '18',
    amenities: ['wifi', 'parking', 'fireplace', 'kitchen', 'heating', 'ski_storage'],
    images: ['/images/cabin1.jpg', '/images/cabin2.jpg'],
    available: true,
    rating: 4.7
  },
  {
    property_name: 'Lakefront Cottage',
    property_type: 'cottage',
    description: 'Rustic lakefront cottage with private dock and stunning mountain views.',
    address: '777 Lakeshore Drive',
    city: 'Lake Tahoe',
    state: 'CA',
    country: 'United States',
    zipcode: '96145',
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    price_per_night: '295',
    cleaning_fee: '50',
    service_fee: '28',
    amenities: ['wifi', 'parking', 'fireplace', 'kitchen', 'heating', 'lake_access', 'boat_dock'],
    images: ['/images/property12.jpg'],
    available: true,
    rating: 4.8
  },
  {
    property_name: 'Downtown Luxury Loft in NYC',
    property_type: 'loft',
    description: 'Modern loft in the heart of the city with amazing skyline views and luxury amenities.',
    address: '789 Broadway',
    city: 'New York',
    state: 'NY',
    country: 'United States',
    zipcode: '10003',
    bedrooms: 1,
    bathrooms: 1.5,
    max_guests: 2,
    price_per_night: '320',
    cleaning_fee: '60',
    service_fee: '30',
    amenities: ['wifi', 'parking', 'gym', 'kitchen', 'air_conditioning', 'elevator', 'city_view'],
    images: ['/images/loft1.jpg'],
    available: true,
    rating: 4.9
  }
];

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing data
    const existingUsers = await User.countDocuments();
    const existingProperties = await Property.countDocuments();
    
    console.log(`\n📊 Current data:`);
    console.log(`   Users: ${existingUsers}`);
    console.log(`   Properties: ${existingProperties}`);

    // Create users
    console.log('\n🔄 Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ⏭️  User ${userData.email} already exists`);
        createdUsers.push(existingUser);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`   ✅ Created user: ${user.name} (${user.email})`);
        createdUsers.push(user);
      }
    }

    // Create properties
    console.log('\n🔄 Creating properties...');
    let propertyCount = 0;
    
    for (const propData of sampleProperties) {
      // Assign random owner from created users (owners only)
      const owners = createdUsers.filter(u => u.role === 'owner');
      const randomOwner = owners[Math.floor(Math.random() * owners.length)];
      
      const property = await Property.create({
        ...propData,
        owner_id: randomOwner._id,
        owner_name: randomOwner.name,
        owner_email: randomOwner.email,
        owner_profile_picture: randomOwner.profile_picture || null
      });
      
      console.log(`   ✅ Created property: ${property.property_name} (Owner: ${randomOwner.name})`);
      propertyCount++;
    }

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`   📊 Created ${createdUsers.length} users`);
    console.log(`   🏠 Created ${propertyCount} properties`);
    
    // Final count
    const totalUsers = await User.countDocuments();
    const totalProperties = await Property.countDocuments();
    
    console.log(`\n📊 Total in database:`);
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Properties: ${totalProperties}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

