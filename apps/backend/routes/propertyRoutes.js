import express from 'express';
import * as propertyController from '../controllers/propertyController.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// Owner-only routes (must be logged in as owner) - MUST BE BEFORE /:id
router.get('/my/properties', propertyController.getMyProperties);
router.post('/', upload.array('images', 10), propertyController.createProperty);

// Public routes (anyone can view)
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Owner-only update/delete routes (must own the property)
router.put('/:id', upload.array('images', 10), propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

export default router;
