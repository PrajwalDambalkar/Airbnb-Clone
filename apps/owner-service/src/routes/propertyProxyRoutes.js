// Owner Service - Property Proxy Routes
// Forwards property-related requests to the Property Service
import { Router } from 'express';
import axios from 'axios';

const router = Router();
const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:5003';

// Middleware to forward session cookies
const forwardSession = (req) => {
  return {
    headers: {
      'Cookie': req.headers.cookie || ''
    }
  };
};

// GET my properties (owner-specific)
router.get('/my/properties', async (req, res) => {
  try {
    const response = await axios.get(
      `${PROPERTY_SERVICE_URL}/api/properties/my/properties`,
      forwardSession(req)
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to property service:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error fetching properties' }
    );
  }
});

// CREATE new property
router.post('/', async (req, res) => {
  try {
    const response = await axios.post(
      `${PROPERTY_SERVICE_URL}/api/properties`,
      req.body,
      forwardSession(req)
    );
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to property service:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error creating property' }
    );
  }
});

// UPDATE property
router.put('/:id', async (req, res) => {
  try {
    const response = await axios.put(
      `${PROPERTY_SERVICE_URL}/api/properties/${req.params.id}`,
      req.body,
      forwardSession(req)
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to property service:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error updating property' }
    );
  }
});

// DELETE property
router.delete('/:id', async (req, res) => {
  try {
    const response = await axios.delete(
      `${PROPERTY_SERVICE_URL}/api/properties/${req.params.id}`,
      forwardSession(req)
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to property service:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error deleting property' }
    );
  }
});

// GET single property (for viewing)
router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${PROPERTY_SERVICE_URL}/api/properties/${req.params.id}`,
      forwardSession(req)
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying to property service:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error fetching property' }
    );
  }
});

export default router;
