'use client'

import { useState } from 'react'
import API, { setAuthToken } from '../lib/api'
import { LoginData, RegisterData, AuthResponse } from '../types/user'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: LoginData): Promise<AuthResponse> => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Sending login request with:', credentials)
      const response = await API.post('/auth/login/', credentials)
      const { token } = response.data
      
      localStorage.setItem('authToken', token)
      setAuthToken(token)
      
      return response.data
    } catch (err: any) {
      console.error('Login error details:', JSON.stringify(err.response?.data, null, 2))
      console.error('Full error object:', err)
      
      let errorMessage = 'Login failed'
      
      if (err.response?.data) {
        const errorData = err.response.data
        console.log('Error data:', errorData)
        
        if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0]
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else {
          errorMessage = `Error: ${JSON.stringify(errorData)}`
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid username or password'
      } else if (err.response?.status === 400) {
        errorMessage = 'Bad request - check your input'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      console.log('Final error message:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Sending register request with:', userData)
      
      const registrationData = {
        username: userData.username || '',
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        password: userData.password || '',
        password_confirm: userData.password_confirm || ''
      }
      
      if (!registrationData.username.trim()) throw new Error('Username is required')
      if (!registrationData.email.trim()) throw new Error('Email is required')
      if (!registrationData.password.trim()) throw new Error('Password is required')
      
      const response = await API.post('/auth/register/', registrationData)
      
      
      const { token } = response.data
      
      if (token) {
        localStorage.setItem('authToken', token)
        setAuthToken(token)
        console.log('Registration successful and user logged in.')
      } else {
        
        console.warn('Registration successful, but no auth token was returned from the API for auto-login.')
      }
      

      return response.data
    } catch (err: any) {
      console.error('Register error details:', JSON.stringify(err.response?.data, null, 2))
      console.error('Registration failed:', err)
      
      const errorData = err.response?.data
      let errorMessage = 'Registration failed'
      
      if (errorData) {
        if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`
        } else if (errorData.password) {
          errorMessage = `Password: ${errorData.password[0]}`
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0]
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else {
          const firstError = Object.entries(errorData)[0]
          if (firstError) {
            const [field, messages] = firstError
            const message = Array.isArray(messages) ? messages[0] : messages
            errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`
          }
        }
      }
      
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { login, register, loading, error, setError }
}
