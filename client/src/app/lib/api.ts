import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})


API.interceptors.request.use((config) => {
  
  const publicEndpoints = ['/auth/register/', '/auth/login/']
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    config.url?.includes(endpoint)
  )
  
  
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


if (typeof window !== 'undefined') {
 
}

export default API