import { Router } from 'express';
import upload from '../config/multer.js';
import * as propertyController from '../controllers/propertyController.js';

const router = Router();

router.get('/my/properties', propertyController.getMyProperties);
router.post('/', upload.array('images', 10), propertyController.createProperty);
router.put('/:id', upload.array('images', 10), propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getPropertyById);

export default router;
