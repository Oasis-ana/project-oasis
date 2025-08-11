'use client'

import { useState, useEffect, useCallback } from 'react'
import { Outfit } from '../types/outfit'


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export function useOutfits() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true)
  const [isUploading, setIsUploading] = useState(false) 

  const fetchOutfits = useCallback(async (skipLoading = false) => {
    if (!skipLoading) {
      setIsLoadingOutfits(true)
    }
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingOutfits(false)
      return
    }
    try {
      console.log('📥 Fetching outfits...')
      const response = await fetch(`${API_URL}/api/auth/outfits/`, {
        headers: { 'Authorization': `Token ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Fetched', data.length, 'outfits')
        setOutfits(data)
      } else {
        console.error('❌ Failed to fetch outfits:', response.status)
      }
    } catch (error) {
      console.error('💥 Error fetching outfits:', error)
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



    setIsUploading(true)

    try {
      console.log('🚀 Starting outfit upload...')
      const response = await fetch(`${API_URL}/api/auth/outfits/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData,
      })

      if (response.ok) {
        const newOutfit = await response.json()
        console.log('✅ Upload successful, adding to list')
        setOutfits(prev => [newOutfit, ...prev])
        return newOutfit
      } else {
        const errorText = await response.text()
        console.error('❌ Upload failed:', response.status, errorText)
        return null
      }
    } catch (error) {
      console.error('💥 Network error during upload:', error)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const updateOutfit = async (outfitId: string, data: FormData | object): Promise<Outfit | null> => {
    const token = localStorage.getItem('authToken')
    if (!token) return null

    const isFormData = data instanceof FormData;
    const headers: HeadersInit = {
      'Authorization': `Token ${token}`,
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      console.log('🔄 Updating outfit...', outfitId)

      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'PATCH',
        headers,
        body: isFormData ? data : JSON.stringify(data),
      })

      if (response.ok) {
        const updatedOutfit = await response.json()
        console.log('✅ Update successful')
        setOutfits(prev => prev.map(o => (o.id === outfitId ? updatedOutfit : o)))
        return updatedOutfit
      } else {
        const errorText = await response.text()
        console.error('❌ Update failed:', response.status, errorText)
        return null
      }
    } catch (error) {
      console.error('💥 Error updating outfit:', error)
      return null
    }
  }

  const deleteOutfit = async (outfitId: string): Promise<boolean> => {
    const token = localStorage.getItem('authToken')
    if (!token) return false

    const previousOutfits = outfits
    setOutfits(prev => prev.filter(o => o.id !== outfitId))

    try {
      console.log('🗑️ Deleting outfit...', outfitId)

      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` },
      })

      if ([200, 204, 404].includes(response.status)) {
        console.log('✅ Delete confirmed:', response.status)
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Delete failed:', response.status, errorText)
        setOutfits(previousOutfits)
        return false
      }
    } catch (error) {
      console.error('💥 Error deleting outfit:', error)
      setOutfits(previousOutfits)
      return false
    }
  }

  const handleLike = async (outfitId: string) => {
    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))

    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/like/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
      })

      if (!response.ok) {
        console.log('❌ Like failed, reverting...')
        setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))
      }
    } catch (error) {
      console.error('💥 Error liking outfit:', error)
      setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o))
    }
  }

  return {
    outfits,
    isLoadingOutfits,
    isUploading,
    fetchOutfits,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    handleLike,
  }
}
