import express from 'express';
import * as propertyController from '../controllers/propertyController.js';

const router = express.Router();

// Public routes (anyone can view)
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Owner-only routes (must be logged in as owner)
router.get('/my/properties', propertyController.getMyProperties);

export default router;
