import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:Somalwar1!@localhost:27017/airbnb_backend?authSource=admin';

const getOwnerId = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await User.findOne({ email: 'owner@test.com' });
        if (user) {
            console.log(`OWNER_ID:${user._id}`);
        } else {
            console.log('Owner not found');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

getOwnerId();
