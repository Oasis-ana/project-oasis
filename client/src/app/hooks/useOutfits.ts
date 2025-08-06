'use client'

import { useState, useEffect, useCallback } from 'react'
import { Outfit } from '../types/outfit'

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true)

  const fetchOutfits = useCallback(async () => {
    setIsLoadingOutfits(true)
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingOutfits(false)
      return
    }
    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/`, {
        headers: { 'Authorization': `Token ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOutfits(data)
      } else {
        console.error('Failed to fetch outfits')
      }
    } catch (error) {
      console.error('Error fetching outfits:', error)
    } finally {
      setIsLoadingOutfits(false)
    }
  }, [])

  useEffect(() => {
    fetchOutfits()
  }, [fetchOutfits])

  const addOutfit = async (formData: FormData): Promise<Outfit | null> => {
    const token = localStorage.getItem('authToken')
    if (!token) return null
    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData,
      })
      if (response.ok) {
        const newOutfit = await response.json()
        setOutfits(prev => [newOutfit, ...prev])
        return newOutfit
      } else {
        console.error('Failed to add outfit:', response.status, await response.text())
        return null
      }
    } catch (error) {
      console.error('Error adding outfit:', error)
      return null
    }
  }

  const updateOutfit = async (outfitId: string, data: FormData | object): Promise<Outfit | null> => {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    // Determine headers based on whether we're sending a file or just text
    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {
      'Authorization': `Token ${token}`,
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'PATCH', // Use PATCH for partial updates to be more efficient
        headers,
        body: isFormData ? data : JSON.stringify(data),
      })

      if (response.ok) {
        const updatedOutfit = await response.json()
        setOutfits(prev => prev.map(o => (o.id === outfitId ? updatedOutfit : o)))
        return updatedOutfit
      } else {
        console.error('Failed to update outfit:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return null
      }
    } catch (error) {
      console.error('Error updating outfit:', error)
      return null
    }
  }

  const deleteOutfit = async (outfitId: string): Promise<boolean> => {
    const token = localStorage.getItem('authToken')
    if (!token) return false
    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      })
      if (response.status === 204 || response.ok) {
        setOutfits(prev => prev.filter(o => o.id !== outfitId))
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting outfit:', error)
      return false
    }
  }

  const handleLike = async (outfitId: string) => {
    // Optimistically update the UI for a snappy feel
    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))
    
    const token = localStorage.getItem('authToken')
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/like/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
      })

      if (!response.ok) {
        // If the server fails, revert the change
        setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))
      }
    } catch (error) {
      console.error('Error liking outfit:', error)
      // Revert on network error as well
      setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))
    }
  }

  return { outfits, isLoadingOutfits, fetchOutfits, handleLike, addOutfit, updateOutfit, deleteOutfit }
}
