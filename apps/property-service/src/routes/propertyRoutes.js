import { Router } from 'express';
import * as propertyController from '../controllers/propertyController.js';

const router = Router();

// Public routes - anyone can view properties
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

// Owner-specific routes - require authentication
router.get('/my/properties', propertyController.getMyProperties);
router.get('/owner/:ownerId', propertyController.getPropertiesByOwner);

// CRUD operations - require owner authentication
router.post('/', propertyController.createProperty);
router.put('/:id', propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

export default router;
