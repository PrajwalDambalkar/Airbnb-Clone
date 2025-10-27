// controllers/propertyController.js
import { promisePool as pool } from '../config/db.js'; // Import the database connection
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET all properties with optional filters
export const getAllProperties = async (req, res) => {
    try {
        const { city, min_price, max_price, guests } = req.query; // Extract query parameters

        // Base query
        let query = 'SELECT * FROM properties WHERE available = 1';
        const params = [];

        // Add filters if provided
        if (city) {
            query += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        if (min_price) {
            query += ' AND price_per_night >= ?';
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            query += ' AND price_per_night <= ?';
            params.push(parseFloat(max_price));
        }

        if (guests) {
            query += ' AND max_guests >= ?';
            params.push(parseInt(guests));
        }

        query += ' ORDER BY created_at DESC';

        const [properties] = await pool.query(query, params);

        // Parse JSON fields (images, amenities) returned as strings from MySQL
        const parsed = properties.map(p => {
            const copy = { ...p };
            try {
                if (copy.images && typeof copy.images === 'string') {
                    copy.images = JSON.parse(copy.images);
                }
            } catch (err) {
                // leave as-is if parsing fails
            }
            try {
                if (copy.amenities && typeof copy.amenities === 'string') {
                    copy.amenities = JSON.parse(copy.amenities);
                }
            } catch (err) {}
            return copy;
        });

        res.json({
            success: true,
            count: parsed.length,
            data: parsed
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

        const [properties] = await pool.query(
            'SELECT * FROM properties WHERE id = ?',
            [id]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        const prop = { ...properties[0] };
        try {
            if (prop.images && typeof prop.images === 'string') prop.images = JSON.parse(prop.images);
        } catch (e) {}
        try {
            if (prop.amenities && typeof prop.amenities === 'string') prop.amenities = JSON.parse(prop.amenities);
        } catch (e) {}

        res.json({
            success: true,
            data: prop
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
        const [properties] = await pool.query(
            'SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );

        // Parse JSON fields
        const parsed = properties.map(p => {
            const copy = { ...p };
            try {
                if (copy.images && typeof copy.images === 'string') {
                    copy.images = JSON.parse(copy.images);
                }
            } catch (err) {}
            try {
                if (copy.amenities && typeof copy.amenities === 'string') {
                    copy.amenities = JSON.parse(copy.amenities);
                }
            } catch (err) {}
            return copy;
        });

        res.json({
            success: true,
            count: parsed.length,
            data: parsed
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

        console.log('Inserting property with:', {
            owner_id: req.session.userId,
            property_name,
            images: images.length,
            amenities: parsedAmenities
        });

        const [result] = await pool.query(
            `INSERT INTO properties (
                owner_id, property_name, property_type, description,
                address, city, state, zipcode, country,
                price_per_night, bedrooms, bathrooms, max_guests,
                images, amenities, available
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.userId, property_name, property_type, description,
                address, city, state, zip_code, country,
                price_per_night, bedrooms, bathrooms, max_guests,
                JSON.stringify(images), JSON.stringify(parsedAmenities), available !== false ? 1 : 0
            ]
        );

        console.log('Property created successfully with ID:', result.insertId);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            propertyId: result.insertId
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

        // Check if user is logged in as owner
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can update properties'
            });
        }

        // Verify property belongs to this owner
        const [existing] = await pool.query(
            'SELECT * FROM properties WHERE id = ? AND owner_id = ?',
            [propertyId, req.session.userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to edit it'
            });
        }

        const currentProperty = existing[0];

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
        await pool.query(
            `UPDATE properties SET
                property_name = ?,
                property_type = ?,
                description = ?,
                address = ?,
                city = ?,
                state = ?,
                zipcode = ?,
                country = ?,
                price_per_night = ?,
                bedrooms = ?,
                bathrooms = ?,
                max_guests = ?,
                images = ?,
                amenities = ?,
                available = ?
            WHERE id = ? AND owner_id = ?`,
            [
                property_name || currentProperty.property_name,
                property_type || currentProperty.property_type,
                description || currentProperty.description,
                address || currentProperty.address,
                city || currentProperty.city,
                state || currentProperty.state,
                zip_code || currentProperty.zipcode,
                country || currentProperty.country,
                price_per_night || currentProperty.price_per_night,
                bedrooms || currentProperty.bedrooms,
                bathrooms || currentProperty.bathrooms,
                max_guests || currentProperty.max_guests,
                JSON.stringify(finalImages),
                JSON.stringify(parsedAmenities),
                available !== undefined ? (available ? 1 : 0) : currentProperty.available,
                propertyId,
                req.session.userId
            ]
        );

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

        // Check if user is logged in as owner
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can delete properties'
            });
        }

        // Verify property belongs to this owner
        const [existing] = await pool.query(
            'SELECT * FROM properties WHERE id = ? AND owner_id = ?',
            [propertyId, req.session.userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Property not found or you do not have permission to delete it'
            });
        }

        const property = existing[0];

        // Check for active bookings
        const [bookings] = await pool.query(
            'SELECT COUNT(*) as count FROM bookings WHERE property_id = ? AND status IN ("pending", "confirmed") AND check_out >= CURDATE()',
            [propertyId]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete property with active or future bookings'
            });
        }

        // Delete photos from filesystem
        if (property.images) {
            let imageList = [];
            try {
                imageList = typeof property.images === 'string' 
                    ? JSON.parse(property.images) 
                    : property.images;
            } catch (err) {
                console.error('Error parsing images:', err);
            }

            imageList.forEach(photoPath => {
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
        await pool.query('DELETE FROM properties WHERE id = ? AND owner_id = ?', [propertyId, req.session.userId]);

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