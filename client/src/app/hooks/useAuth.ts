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
      const response = await API.post('/auth/register/', userData)
      return response.data
    } catch (err: any) {
      console.error('Register error details:', JSON.stringify(err.response?.data, null, 2))
      
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
        } else {
          errorMessage = `Error: ${JSON.stringify(errorData)}`
        }
      }
      
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { login, register, loading, error }
}