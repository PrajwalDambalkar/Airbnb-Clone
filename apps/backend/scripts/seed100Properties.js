// scripts/seed100Properties.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

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

const propertyTypes = ['apartment', 'house', 'condo', 'villa', 'cabin', 'cottage', 'loft'];
const propertyPrefixes = ['Luxury', 'Cozy', 'Modern', 'Spacious', 'Charming', 'Beautiful', 'Stunning', 'Elegant', 'Contemporary', 'Classic'];
const propertySuffixes = ['Retreat', 'Haven', 'Escape', 'Getaway', 'Residence', 'Suite', 'Home', 'Place', 'Hideaway', 'Sanctuary'];

const amenitiesList = [
  ['wifi', 'parking', 'kitchen', 'air_conditioning', 'heating'],
  ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'gym'],
  ['wifi', 'parking', 'kitchen', 'air_conditioning', 'washer', 'dryer'],
  ['wifi', 'parking', 'pool', 'hot_tub', 'kitchen', 'air_conditioning', 'beach_access'],
  ['wifi', 'parking', 'kitchen', 'air_conditioning', 'fireplace', 'mountain_view'],
  ['wifi', 'parking', 'pool', 'kitchen', 'air_conditioning', 'ocean_view', 'bbq_grill'],
  ['wifi', 'parking', 'gym', 'kitchen', 'air_conditioning', 'elevator', 'city_view'],
  ['wifi', 'parking', 'kitchen', 'air_conditioning', 'balcony', 'lake_view'],
  ['wifi', 'parking', 'pool', 'hot_tub', 'kitchen', 'air_conditioning', 'sauna'],
  ['wifi', 'parking', 'kitchen', 'air_conditioning', 'washer', 'dryer', 'backyard', 'pet_friendly']
];

const cityData = {
  'Lake Tahoe': { state: 'CA', country: 'United States', count: 15, zipcodeBase: 96150 },
  'San Diego': { state: 'CA', country: 'United States', count: 20, zipcodeBase: 92101 },
  'Los Angeles': { state: 'CA', country: 'United States', count: 25, zipcodeBase: 90001 },
  'Las Vegas': { state: 'NV', country: 'United States', count: 20, zipcodeBase: 89101 },
  'New York': { state: 'NY', country: 'United States', count: 12, zipcodeBase: 10001 },
  'Chicago': { state: 'IL', country: 'United States', count: 8, zipcodeBase: 60601 }
};

function generatePropertyName(city, index) {
  const prefix = propertyPrefixes[index % propertyPrefixes.length];
  const suffix = propertySuffixes[Math.floor(index / 2) % propertySuffixes.length];
  const type = propertyTypes[index % propertyTypes.length];
  
  if (city === 'Lake Tahoe') {
    return `${prefix} Lakefront ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
  } else if (city === 'San Diego') {
    return `${prefix} Coastal ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
  } else if (city === 'Los Angeles') {
    return `${prefix} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)} in LA`;
  } else if (city === 'Las Vegas') {
    return `${prefix} Vegas ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
  } else if (city === 'New York') {
    return `${prefix} NYC ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
  } else if (city === 'Chicago') {
    return `${prefix} Downtown ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
  }
  return `${prefix} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`;
}

function generateDescription(city, propertyType) {
  const descriptions = {
    'Lake Tahoe': [
      'Beautiful lakefront property with stunning mountain views and private dock access.',
      'Cozy cabin retreat perfect for skiing and outdoor adventures.',
      'Luxurious mountain home with panoramic lake views and modern amenities.',
      'Charming cottage nestled in the pines with easy access to hiking trails.'
    ],
    'San Diego': [
      'Stunning beachfront property with ocean views and private beach access.',
      'Modern coastal home perfect for families and beach lovers.',
      'Elegant villa with rooftop terrace overlooking the Pacific Ocean.',
      'Spacious condo in the heart of Gaslamp Quarter with city views.'
    ],
    'Los Angeles': [
      'Contemporary home in prime LA location with Hollywood Hills views.',
      'Stylish apartment near Santa Monica with easy beach access.',
      'Luxurious villa in Beverly Hills with pool and entertainment area.',
      'Modern loft in downtown LA with skyline views and rooftop access.'
    ],
    'Las Vegas': [
      'Upscale condo on the Strip with stunning city and mountain views.',
      'Modern retreat close to casinos and entertainment venues.',
      'Luxury villa with private pool and outdoor entertainment space.',
      'Contemporary home perfect for Vegas getaways and group stays.'
    ],
    'New York': [
      'Chic Manhattan apartment with Empire State Building views.',
      'Modern loft in SoHo with exposed brick and high ceilings.',
      'Elegant brownstone in Brooklyn with classic NYC charm.',
      'Luxury penthouse with panoramic city skyline views.'
    ],
    'Chicago': [
      'Stunning high-rise condo with Lake Michigan views.',
      'Modern apartment in the Loop with easy access to attractions.',
      'Elegant townhouse in Lincoln Park with private garden.',
      'Contemporary loft in River North with city skyline views.'
    ]
  };
  
  const cityDescriptions = descriptions[city] || descriptions['Los Angeles'];
  return cityDescriptions[Math.floor(Math.random() * cityDescriptions.length)];
}

function generateAddress(city, index) {
  const streetNumbers = [100, 234, 456, 789, 1001, 1234, 2345, 3456, 4567, 5678];
  const streetNames = {
    'Lake Tahoe': ['Lakeshore Drive', 'Mountain Road', 'Pine Street', 'Cedar Avenue', 'Summit Way'],
    'San Diego': ['Ocean Boulevard', 'Pacific Coast Highway', 'Beach Avenue', 'Harbor Drive', 'Sunset Cliffs'],
    'Los Angeles': ['Sunset Boulevard', 'Hollywood Drive', 'Wilshire Boulevard', 'Venice Beach Walk', 'Rodeo Drive'],
    'Las Vegas': ['Las Vegas Boulevard', 'Paradise Road', 'Flamingo Road', 'Desert Inn Road', 'Spring Mountain'],
    'New York': ['Broadway', 'Fifth Avenue', 'Park Avenue', 'Madison Avenue', 'Lexington Avenue'],
    'Chicago': ['Michigan Avenue', 'State Street', 'Lake Shore Drive', 'Wacker Drive', 'Clark Street']
  };
  
  const streets = streetNames[city] || streetNames['Los Angeles'];
  const streetNum = streetNumbers[index % streetNumbers.length] + index;
  const street = streets[index % streets.length];
  
  return `${streetNum} ${street}`;
}

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create owners
    console.log('👥 Setting up owner accounts...');
    const ownerEmails = ['owner@test.com', 'bob@test.com', 'jane@test.com'];
    const owners = [];
    
    for (const email of ownerEmails) {
      let owner = await User.findOne({ email });
      if (!owner) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        owner = await User.create({
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email,
          password: hashedPassword,
          role: 'owner',
          city: 'San Francisco',
          state: 'CA',
          country: 'United States'
        });
        console.log(`   ✅ Created owner: ${owner.name}`);
      } else {
        console.log(`   ⏭️  Owner exists: ${owner.name}`);
      }
      owners.push(owner);
    }

    // Clear existing properties
    console.log('\n🗑️  Clearing existing properties...');
    const deleteResult = await Property.deleteMany({});
    console.log(`   Deleted ${deleteResult.deletedCount} properties`);

    // Generate 100 properties
    console.log('\n🏠 Creating 100 properties across cities...\n');
    let propertyIndex = 1;
    const allProperties = [];

    for (const [city, data] of Object.entries(cityData)) {
      console.log(`📍 ${city}, ${data.state} (${data.count} properties)`);
      
      for (let i = 0; i < data.count; i++) {
        const randomOwner = owners[Math.floor(Math.random() * owners.length)];
        const propertyType = propertyTypes[propertyIndex % propertyTypes.length];
        const bedrooms = Math.floor(Math.random() * 4) + 1;
        const bathrooms = Math.floor(Math.random() * 3) + 1;
        const maxGuests = bedrooms * 2 + Math.floor(Math.random() * 2);
        const basePrice = Math.floor(Math.random() * 400) + 100;
        const cleaningFee = Math.floor(basePrice * 0.15);
        const serviceFee = Math.floor(basePrice * 0.12);
        
        // Use the actual hotel images
        const imageNumber = String(propertyIndex).padStart(3, '0');
        const images = [
          `/images/properties/hotel_${imageNumber}.jpg`
        ];
        
        // Add a second image for some properties
        if (propertyIndex < 100) {
          const secondImageNumber = String(propertyIndex + 1).padStart(3, '0');
          images.push(`/images/properties/hotel_${secondImageNumber}.jpg`);
        }
        
        const property = {
          property_name: generatePropertyName(city, i),
          property_type: propertyType,
          description: generateDescription(city, propertyType),
          address: generateAddress(city, i),
          city: city,
          state: data.state,
          country: data.country,
          zipcode: String(data.zipcodeBase + i),
          bedrooms,
          bathrooms,
          max_guests: maxGuests,
          price_per_night: String(basePrice),
          cleaning_fee: String(cleaningFee),
          service_fee: String(serviceFee),
          amenities: amenitiesList[propertyIndex % amenitiesList.length],
          images,
          available: true,
          owner_id: randomOwner._id,
          owner_name: randomOwner.name,
          owner_email: randomOwner.email,
          owner_profile_picture: randomOwner.profile_picture || null,
          rating: (Math.random() * 1.5 + 3.5).toFixed(1)
        };
        
        allProperties.push(property);
        propertyIndex++;
        
        if (propertyIndex > 100) break;
      }
      
      if (propertyIndex > 100) break;
    }

    // Insert all properties
    const createdProperties = await Property.insertMany(allProperties);
    console.log(`\n✅ Successfully created ${createdProperties.length} properties!`);

    // Summary by city
    console.log('\n📊 Properties by City:');
    for (const [city, data] of Object.entries(cityData)) {
      const count = await Property.countDocuments({ city });
      console.log(`   ${city}, ${data.state}: ${count} properties`);
    }

    const totalProperties = await Property.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log(`\n🎉 Database seeding completed!`);
    console.log(`   📊 Total Properties: ${totalProperties}`);
    console.log(`   👥 Total Users: ${totalUsers}`);
    console.log(`   🖼️  All properties have images from hotel_001.jpg to hotel_100.jpg`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

