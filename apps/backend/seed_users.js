import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:Somalwar1!@localhost:27017/airbnb_backend?authSource=admin';

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const testUsers = [
            {
                name: 'Test Traveler',
                email: 'traveler@test.com',
                password: 'password123',
                role: 'traveler'
            },
            {
                name: 'Test Owner',
                email: 'owner@test.com',
                password: 'password123',
                role: 'owner'
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists`);
                // Update password just in case
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                existingUser.password = hashedPassword;
                await existingUser.save();
                console.log(`Updated password for ${userData.email}`);
            } else {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);

                await User.create({
                    ...userData,
                    password: hashedPassword
                });
                console.log(`Created user ${userData.email}`);
            }
        }

        console.log('Seeding complete');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedUsers();
