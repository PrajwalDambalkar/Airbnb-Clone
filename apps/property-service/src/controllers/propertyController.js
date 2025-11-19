// Property Service Controller
import Property from '../models/Property.js';
import mongoose from 'mongoose';

// GET all properties with optional filters
export const getAllProperties = async (req, res) => {
    try {
        const { city, min_price, max_price, guests } = req.query;

        // Build query object
        let query = { available: true };

        // Add filters if provided
        if (city) {
            query.city = { $regex: city, $options: 'i' };
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

        const property = await Property.findById(id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            data: property
        });
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching property'
        });
    }
};

// GET properties by owner ID
export const getPropertiesByOwner = async (req, res) => {
    try {
        const { ownerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner ID'
            });
        }

        const properties = await Property.find({ owner_id: ownerId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: properties.length,
            data: properties
        });
    } catch (error) {
        console.error('Error fetching owner properties:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching owner properties'
        });
    }
};

// GET properties for logged-in owner (with session check)
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
        console.log('Session:', { userId: req.session?.userId, role: req.session?.userRole });
        console.log('Body:', req.body);

        if (!req.session?.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can create properties'
            });
        }

        const {
            property_name, property_type, description,
            address, city, state, zip_code, country,
            price_per_night, bedrooms, bathrooms, max_guests,
            amenities, images, available
        } = req.body;

        // Validate required fields
        if (!property_name || !property_type || !address || !city || !country || !price_per_night) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

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
            images: images || [],
            amenities: amenities || [],
            available: available !== false
        });

        console.log('Property created successfully with ID:', newProperty._id);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: newProperty
        });
    } catch (error) {
        console.error('Error creating property:', error);
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
        const propertyId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID'
            });
        }

        if (!req.session?.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can update properties'
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
                message: 'Property not found or you do not have permission to edit it'
            });
        }

        // Update property fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                property[key] = req.body[key];
            }
        });

        await property.save();

        res.json({
            success: true,
            message: 'Property updated successfully',
            data: property
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
        const propertyId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID'
            });
        }

        if (!req.session?.userId || req.session.userRole !== 'owner') {
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

        await Property.findByIdAndDelete(propertyId);

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
