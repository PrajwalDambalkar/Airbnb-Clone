import axios from 'axios';

/**
 * Shared Axios instance for backend → microservice calls.
 * 
 * - Adds a sensible default timeout
 * - Can be extended later for tracing / auth headers / retries
 */
const httpClient = axios.create({
  timeout: 30000, // 30 seconds; adjust per service if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Basic response/error logging hook (safe to keep minimal for now)
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Avoid noisy logging on common client errors (4xx), but log server/connection issues
    const status = error.response?.status;
    if (!status || status >= 500) {
      console.error('HTTP client error:', {
        message: error.message,
        status,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

export default httpClient;


