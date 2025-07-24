import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to handle auth tokens properly
API.interceptors.request.use((config) => {
  // Don't add token to public endpoints
  const publicEndpoints = ['/auth/register/', '/auth/login/']
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  )
  
  // Only add auth token to protected endpoints
  if (!isPublicEndpoint && typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
  }
  
  return config
})

export const setAuthToken = (token: string | null) => {
  // Don't set global default headers - let the interceptor handle it
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }
}

// Clear any old token on startup
if (typeof window !== 'undefined') {
  // Don't clear the token automatically - let users stay logged in
  // localStorage.removeItem('authToken') // Remove this line
}

export default API