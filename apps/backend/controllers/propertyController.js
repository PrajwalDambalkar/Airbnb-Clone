// controllers/propertyController.js
import { promisePool as pool } from '../config/db.js'; // Import the database connection

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

// UPDATE existing property
export const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is logged in
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can update properties'
            });
        }

        // First, verify this property belongs to the logged-in owner
        const [existing] = await pool.query(
            'SELECT owner_id FROM properties WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (existing[0].owner_id !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own properties'
            });
        }

        const {
            property_name, property_type, description,
            address, city, state, zip_code, country,
            price_per_night, bedrooms, bathrooms, max_guests,
            amenities, available
        } = req.body;

        // Build update query dynamically for provided fields
        const updates = [];
        const params = [];

        if (property_name !== undefined) { updates.push('property_name = ?'); params.push(property_name); }
        if (property_type !== undefined) { updates.push('property_type = ?'); params.push(property_type); }
        if (description !== undefined) { updates.push('description = ?'); params.push(description); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (city !== undefined) { updates.push('city = ?'); params.push(city); }
        if (state !== undefined) { updates.push('state = ?'); params.push(state); }
        if (zip_code !== undefined) { updates.push('zipcode = ?'); params.push(zip_code); }
        if (country !== undefined) { updates.push('country = ?'); params.push(country); }
        if (price_per_night !== undefined) { updates.push('price_per_night = ?'); params.push(price_per_night); }
        if (bedrooms !== undefined) { updates.push('bedrooms = ?'); params.push(bedrooms); }
        if (bathrooms !== undefined) { updates.push('bathrooms = ?'); params.push(bathrooms); }
        if (max_guests !== undefined) { updates.push('max_guests = ?'); params.push(max_guests); }
        if (available !== undefined) { updates.push('available = ?'); params.push(available !== false ? 1 : 0); }

        // Handle amenities
        if (amenities !== undefined) {
            let parsedAmenities = amenities;
            if (typeof amenities === 'string') {
                try {
                    parsedAmenities = JSON.parse(amenities);
                } catch (err) {
                    parsedAmenities = [];
                }
            }
            updates.push('amenities = ?');
            params.push(JSON.stringify(parsedAmenities));
        }

        // Handle new image uploads (append to existing images)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/properties/${file.filename}`);

            // Get existing images
            const [propData] = await pool.query('SELECT images FROM properties WHERE id = ?', [id]);
            let existingImages = [];
            try {
                if (propData[0].images && typeof propData[0].images === 'string') {
                    existingImages = JSON.parse(propData[0].images);
                }
            } catch (e) {}

            const allImages = [...existingImages, ...newImages];
            updates.push('images = ?');
            params.push(JSON.stringify(allImages));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at timestamp
        updates.push('updated_at = NOW()');

        // Add the property ID as the last parameter
        params.push(id);

        const query = `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`;
        await pool.query(query, params);

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
        const { id } = req.params;

        // Check if user is logged in
        if (!req.session.userId || req.session.userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Only owners can delete properties'
            });
        }

        // First, verify this property belongs to the logged-in owner
        const [existing] = await pool.query(
            'SELECT owner_id FROM properties WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        if (existing[0].owner_id !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own properties'
            });
        }

        // Delete the property
        await pool.query('DELETE FROM properties WHERE id = ?', [id]);

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