import axios, { InternalAxiosRequestConfig } from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const API = axios.create({
  
  baseURL: `${API_URL}/api`, 
  headers: {
    'Content-Type': 'application/json',
  },
});


API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
 
  const publicEndpoints = ['/auth/register/', '/auth/login/'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  );
  

  if (!isPublicEndpoint && typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
  
      config.headers.Authorization = `Token ${token}`;
    }
  }
  
  return config;
});

/**

 * @param {string | null} token The auth token received from the API.
 */
export const setAuthToken = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }
};

export default API;