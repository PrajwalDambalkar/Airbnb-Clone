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

        res.json({
            success: true,
            data: properties[0]
        });
    } catch (error) {
        console.error('Error fetching property:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching property'
        });
    }
};