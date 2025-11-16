// controllers/propertyController.js
import Property from '../models/Property.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET all properties with optional filters
export const getAllProperties = async (req, res) => {
    try {
        const { city, min_price, max_price, guests } = req.query;

        // Build query object
        let query = { available: true };

        // Add filters if provided
        if (city) {
            query.city = { $regex: city, $options: 'i' }; // Case-insensitive search
        }

        if (min_price || max_price) {
            query.price_per_night = {};
            if (min_price) {
                query.price_per_night.$gte = parseFloat(min_price);
            }
            if (max_price) {
                query.price_per_night.$lte = parseFloat(max_price);
            }
        }

        if (guests) {
            query.max_guests = { $gte: parseInt(guests) };
        }

        const properties = await Property.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching properties'
        });
    }
};

// GET single property by ID
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID'
            });
        }

        const property = await Property.findById(id).populate('owner_id', 'name email createdAt profile_picture');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Format response to match MySQL structure
        const propertyData = property.toObject();
        if (property.owner_id) {
            propertyData.owner_name = property.owner_id.name;
            propertyData.owner_email = property.owner_id.email;
            propertyData.owner_since = property.owner_id.createdAt;
            propertyData.owner_profile_picture = property.owner_id.profile_picture;
        }

        res.json({
            success: true,
            data: propertyData
        });
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching property'
        });
    }
};

// GET properties for logged-in owner
export const getMyProperties = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Check if user is an owner
        if (req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can access their properties'
            });
        }

        // Fetch properties owned by this user
        const properties = await Property.find({ owner_id: req.session.userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Error fetching owner properties:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your properties'
        });
    }
};

// CREATE new property
export const createProperty = async (req, res) => {
    try {
        console.log('=== CREATE PROPERTY REQUEST ===');
        console.log('Session:', { userId: req.session.userId, role: req.session.userRole });
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can create properties'
            });
        }

        const {
            property_name, property_type, description,
            address, city, state, zip_code, country,
            price_per_night, bedrooms, bathrooms, max_guests,
            amenities, available
        } = req.body;

        // Validate required fields
        if (!property_name || !property_type || !address || !city || !state || !country || !price_per_night) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get uploaded image paths
        const images = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];

        // Parse amenities if it's a JSON string (from FormData)
        let parsedAmenities = amenities;
        if (typeof amenities === 'string') {
            try {
                parsedAmenities = JSON.parse(amenities);
            } catch (err) {
                console.error('Error parsing amenities:', err);
                parsedAmenities = [];
            }
        }

        console.log('Creating property with:', {
            owner_id: req.session.userId,
            property_name,
            images: images.length,
            amenities: parsedAmenities
        });

        const newProperty = await Property.create({
            owner_id: req.session.userId,
            property_name,
            property_type,
            description,
            address,
            city,
            state,
            zipcode: zip_code,
            country,
            price_per_night,
            bedrooms,
            bathrooms,
            max_guests,
            images,
            amenities: parsedAmenities,
            available: available !== false
        });

        console.log('Property created successfully with ID:', newProperty._id);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            propertyId: newProperty._id
        });
    } catch (error) {
        console.error('Error creating property:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error creating property',
            error: error.message
        });
    }
};

// UPDATE property
export const updateProperty = async (req, res) => {
    try {
        console.log('=== UPDATE PROPERTY REQUEST ===');
        console.log('Property ID:', req.params.id);
        console.log('Session:', { userId: req.session.userId, role: req.session.userRole });
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const propertyId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID'
            });
        }

        // Check if user is logged in as owner
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can update properties'
            });
        }

        // Verify property belongs to this owner
        const currentProperty = await Property.findOne({ 
            _id: propertyId, 
            owner_id: req.session.userId 
        });

        if (!currentProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to edit it'
            });
        }

        const {
            property_name, property_type, description,
            address, city, state, zip_code, country,
            price_per_night, bedrooms, bathrooms, max_guests,
            amenities, available,
            existing_photos, photos_to_delete
        } = req.body;

        // Parse existing photos and photos to delete
        let existingPhotosList = [];
        let photosToDeleteList = [];

        if (existing_photos) {
            try {
                existingPhotosList = typeof existing_photos === 'string' 
                    ? JSON.parse(existing_photos) 
                    : existing_photos;
            } catch (err) {
                console.error('Error parsing existing_photos:', err);
            }
        }

        if (photos_to_delete) {
            try {
                photosToDeleteList = typeof photos_to_delete === 'string' 
                    ? JSON.parse(photos_to_delete) 
                    : photos_to_delete;
            } catch (err) {
                console.error('Error parsing photos_to_delete:', err);
            }
        }

        // Delete photos from filesystem
        if (photosToDeleteList.length > 0) {
            photosToDeleteList.forEach(photoPath => {
                try {
                    const fullPath = path.join(__dirname, '..', photoPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log('Deleted photo:', photoPath);
                    }
                } catch (err) {
                    console.error('Error deleting photo:', photoPath, err);
                }
            });
        }

        // Get new uploaded image paths
        const newImages = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];

        // Combine existing photos (not deleted) + new photos
        const finalImages = [...existingPhotosList, ...newImages];

        // Parse amenities
        let parsedAmenities = amenities;
        if (typeof amenities === 'string') {
            try {
                parsedAmenities = JSON.parse(amenities);
            } catch (err) {
                console.error('Error parsing amenities:', err);
                parsedAmenities = currentProperty.amenities;
            }
        }

        console.log('Updating property with:', {
            property_name,
            finalImages: finalImages.length,
            amenities: parsedAmenities
        });

        // Update the property
        currentProperty.property_name = property_name || currentProperty.property_name;
        currentProperty.property_type = property_type || currentProperty.property_type;
        currentProperty.description = description || currentProperty.description;
        currentProperty.address = address || currentProperty.address;
        currentProperty.city = city || currentProperty.city;
        currentProperty.state = state || currentProperty.state;
        currentProperty.zipcode = zip_code || currentProperty.zipcode;
        currentProperty.country = country || currentProperty.country;
        currentProperty.price_per_night = price_per_night || currentProperty.price_per_night;
        currentProperty.bedrooms = bedrooms || currentProperty.bedrooms;
        currentProperty.bathrooms = bathrooms || currentProperty.bathrooms;
        currentProperty.max_guests = max_guests || currentProperty.max_guests;
        currentProperty.images = finalImages;
        currentProperty.amenities = parsedAmenities;
        currentProperty.available = available !== undefined ? (available ? true : false) : currentProperty.available;

        await currentProperty.save();

        console.log('Property updated successfully');

        res.json({
            success: true,
            message: 'Property updated successfully'
        });
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating property',
            error: error.message
        });
    }
};

// DELETE property
export const deleteProperty = async (req, res) => {
    try {
        console.log('=== DELETE PROPERTY REQUEST ===');
        console.log('Property ID:', req.params.id);
        console.log('Session:', { userId: req.session.userId, role: req.session.userRole });

        const propertyId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID'
            });
        }

        // Check if user is logged in as owner
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can delete properties'
            });
        }

        // Verify property belongs to this owner
        const property = await Property.findOne({ 
            _id: propertyId, 
            owner_id: req.session.userId 
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to delete it'
            });
        }

        // Check for active bookings
        const activeBookingsCount = await Booking.countDocuments({
            property_id: propertyId,
            status: { $in: ['PENDING', 'ACCEPTED'] },
            check_out: { $gte: new Date() }
        });

        if (activeBookingsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete property with active or future bookings'
            });
        }

        // Delete photos from filesystem
        if (property.images && property.images.length > 0) {
            property.images.forEach(photoPath => {
                try {
                    const fullPath = path.join(__dirname, '..', photoPath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                        console.log('Deleted photo:', photoPath);
                    }
                } catch (err) {
                    console.error('Error deleting photo:', photoPath, err);
                }
            });
        }

        // Delete the property
        await Property.findByIdAndDelete(propertyId);

        console.log('Property deleted successfully');

        res.json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting property',
            error: error.message
        });
    }
};
