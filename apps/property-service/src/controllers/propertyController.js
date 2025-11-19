import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICE_ROOT = path.resolve(__dirname, '../../');

const resolveUploadPath = (relativePath) => {
  if (!relativePath) {
    return null;
  }

  const normalised = relativePath.replace(/^\/+/, '');
  return path.join(SERVICE_ROOT, normalised);
};

export const getAllProperties = async (req, res) => {
  try {
    const { city, min_price, max_price, guests } = req.query;
    const query = { available: true };

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (min_price || max_price) {
      query.price_per_night = {};
      if (min_price) query.price_per_night.$gte = parseFloat(min_price);
      if (max_price) query.price_per_night.$lte = parseFloat(max_price);
    }

    if (guests) {
      query.max_guests = { $gte: parseInt(guests, 10) };
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

    const propertyObject = property.toObject();
    if (property.owner_id) {
      propertyObject.owner_name = property.owner_id.name;
      propertyObject.owner_email = property.owner_id.email;
      propertyObject.owner_since = property.owner_id.createdAt;
      propertyObject.owner_profile_picture = property.owner_id.profile_picture;
    }

    res.json({
      success: true,
      data: propertyObject
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property'
    });
  }
};

export const getMyProperties = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (req.session.userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can access their properties'
      });
    }

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

export const createProperty = async (req, res) => {
  try {
    if (!req.session.userId || req.session.userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can create properties'
      });
    }

    const {
      property_name,
      property_type,
      description,
      address,
      city,
      state,
      zip_code,
      country,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      available
    } = req.body;

    if (!property_name || !property_type || !address || !city || !country || !price_per_night) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const images = req.files ? req.files.map((file) => `/uploads/properties/${file.filename}`) : [];

    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (err) {
        console.error('Error parsing amenities:', err);
        parsedAmenities = [];
      }
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
      images,
      amenities: parsedAmenities,
      available: available !== false
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      propertyId: newProperty._id
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

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    if (!req.session.userId || req.session.userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can update properties'
      });
    }

    const property = await Property.findOne({
      _id: id,
      owner_id: req.session.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or access denied'
      });
    }

    const {
      property_name,
      property_type,
      description,
      address,
      city,
      state,
      zip_code,
      country,
      price_per_night,
      bedrooms,
      bathrooms,
      max_guests,
      amenities,
      available,
      existing_photos,
      photos_to_delete
    } = req.body;

    let existingPhotosList = [];
    let photosToDeleteList = [];

    if (existing_photos) {
      try {
        existingPhotosList = typeof existing_photos === 'string' ? JSON.parse(existing_photos) : existing_photos;
      } catch (err) {
        console.error('Error parsing existing_photos:', err);
      }
    }

    if (photos_to_delete) {
      try {
        photosToDeleteList = typeof photos_to_delete === 'string' ? JSON.parse(photos_to_delete) : photos_to_delete;
      } catch (err) {
        console.error('Error parsing photos_to_delete:', err);
      }
    }

    if (photosToDeleteList.length > 0) {
      photosToDeleteList.forEach((photoPath) => {
        try {
          const absolutePath = resolveUploadPath(photoPath);
          if (absolutePath && fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        } catch (err) {
          console.error('Error deleting photo:', photoPath, err);
        }
      });
    }

    const newImages = req.files ? req.files.map((file) => `/uploads/properties/${file.filename}`) : [];
    const finalImages = [...existingPhotosList, ...newImages];

    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (err) {
        console.error('Error parsing amenities:', err);
        parsedAmenities = property.amenities;
      }
    }

    property.property_name = property_name || property.property_name;
    property.property_type = property_type || property.property_type;
    property.description = description || property.description;
    property.address = address || property.address;
    property.city = city || property.city;
    property.state = state || property.state;
    property.zipcode = zip_code || property.zipcode;
    property.country = country || property.country;
    property.price_per_night = price_per_night || property.price_per_night;
    property.bedrooms = bedrooms || property.bedrooms;
    property.bathrooms = bathrooms || property.bathrooms;
    property.max_guests = max_guests || property.max_guests;
    property.images = finalImages;
    property.amenities = parsedAmenities;
    property.available = available !== undefined ? Boolean(available) : property.available;

    await property.save();

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

export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    if (!req.session.userId || req.session.userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can delete properties'
      });
    }

    const property = await Property.findOne({
      _id: id,
      owner_id: req.session.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found or access denied'
      });
    }

    property.images.forEach((photoPath) => {
      try {
        const absolutePath = resolveUploadPath(photoPath);
        if (absolutePath && fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      } catch (err) {
        console.error('Error deleting photo during property removal:', photoPath, err);
      }
    });

    await Property.deleteOne({ _id: id });

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


