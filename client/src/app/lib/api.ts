import axios, { InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const API = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const publicEndpoints = ['/auth/register/', '/auth/login/'];

  // More precise check for public endpoints:
  // Remove baseURL from URL to get relative path for matching
  const urlPath = config.url?.replace(config.baseURL || '', '');
  const isPublicEndpoint = publicEndpoints.some(endpoint => urlPath === endpoint);

  if (!isPublicEndpoint && typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  }

  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - operation took too long');
      error.message = 'Request timed out. Please try again.';
    }

    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      console.error('Authentication failed');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 500) {
      console.error('Server error occurred');
      error.message = 'Server error. Please try again later.';
    }

    return Promise.reject(error);
  }
);

/**
 * @param {string | null} token The auth token received from the API.
 */
export const setAuthToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
      API.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete API.defaults.headers.common['Authorization'];
    }
  }
};

/**
 * Delete an item with retry logic
 * @param {string} itemId - The ID of the item to delete
 * @param {string} endpoint - The API endpoint (e.g., 'posts', 'items')
 * @param {number} retries - Number of retry attempts
 */
export const deleteItem = async (itemId: string, endpoint: string = 'items', retries: number = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await API.delete(`/${endpoint}/${itemId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Delete attempt ${i + 1} failed:`, error.message);

      if (i === retries) {
        // Final attempt failed, throw the error
        throw new Error(error.response?.data?.message || error.message || 'Delete failed');
      }

      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s...
      console.log(`Retrying delete in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Generic API methods with better error handling
 */
export const apiMethods = {
  get: async (url: string) => {
    try {
      const response = await API.get(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  post: async (url: string, data: any) => {
    try {
      const response = await API.post(url, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  put: async (url: string, data: any) => {
    try {
      const response = await API.put(url, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Request failed');
    }
  },

  delete: async (url: string) => {
    try {
      const response = await API.delete(url);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Delete failed');
    }
  }
};

export default API;
