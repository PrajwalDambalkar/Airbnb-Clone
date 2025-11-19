import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from './src/models/Property.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:Somalwar1!@localhost:27017/airbnb_properties?authSource=admin';
const OWNER_ID = '691d7fcc81908618117a3c41'; // Retrieved from backend

const sampleProperties = [
    {
        owner_id: OWNER_ID,
        property_name: "Luxury Beachfront Villa",
        property_type: "villa",
        description: "Experience ultimate luxury in this stunning beachfront villa with panoramic ocean views. Features a private infinity pool, direct beach access, and modern amenities.",
        address: "123 Ocean Drive",
        city: "Malibu",
        state: "CA",
        country: "USA",
        zipcode: "90265",
        bedrooms: 4,
        bathrooms: 3,
        max_guests: 8,
        price_per_night: 1200,
        cleaning_fee: 200,
        service_fee: 100,
        amenities: ["wifi", "pool", "beach_access", "kitchen", "ac", "parking"],
        images: [
            "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        ],
        available: true
    },
    {
        owner_id: OWNER_ID,
        property_name: "Cozy Mountain Cabin",
        property_type: "cabin",
        description: "Escape to nature in this charming log cabin. Perfect for a romantic getaway or a small family retreat. Enjoy the fireplace and hiking trails nearby.",
        address: "456 Pine Trail",
        city: "Aspen",
        state: "CO",
        country: "USA",
        zipcode: "81611",
        bedrooms: 2,
        bathrooms: 1,
        max_guests: 4,
        price_per_night: 350,
        cleaning_fee: 100,
        service_fee: 50,
        amenities: ["wifi", "fireplace", "heating", "kitchen", "parking"],
        images: [
            "https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        ],
        available: true
    },
    {
        owner_id: OWNER_ID,
        property_name: "Modern Downtown Loft",
        property_type: "loft",
        description: "Stay in the heart of the city in this stylish loft apartment. Walking distance to best restaurants, shops, and nightlife.",
        address: "789 Main Street",
        city: "New York",
        state: "NY",
        country: "USA",
        zipcode: "10001",
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        price_per_night: 250,
        cleaning_fee: 80,
        service_fee: 40,
        amenities: ["wifi", "ac", "kitchen", "elevator", "gym"],
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        ],
        available: true
    }
];

const seedProperties = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB (Properties)');

        await Property.deleteMany({}); // Clear existing
        console.log('Cleared existing properties');

        await Property.insertMany(sampleProperties);
        console.log(`Seeded ${sampleProperties.length} properties`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedProperties();
