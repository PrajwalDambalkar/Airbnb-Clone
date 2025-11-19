// Service URLs Configuration
export const SERVICES = {
  TRAVELER: import.meta.env.VITE_TRAVELER_SERVICE_URL || 'http://localhost:5001',
  OWNER: import.meta.env.VITE_OWNER_SERVICE_URL || 'http://localhost:5002',
  PROPERTY: import.meta.env.VITE_PROPERTY_SERVICE_URL || 'http://localhost:5003',
  BOOKING: import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:5004',
};

// Default API URL (for backward compatibility)
export const API_BASE_URL = import.meta.env.VITE_API_URL || SERVICES.PROPERTY;
