import express from 'express';
import * as propertyController from '../controllers/propertyController.js';

const router = express.Router();

// Public routes (anyone can view)
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

export default router;
