'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Outfit } from '../types/outfit'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export const useOutfits = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true)
  const router = useRouter()

  const fetchOutfits = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingOutfits(false)
      return
    }

    try {
      setIsLoadingOutfits(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const outfitData = await response.json()
        console.log('📥 Fetched outfits:', outfitData.length, 'items')
        
        outfitData.forEach((outfit: any, index: number) => {
          console.log(`Outfit ${index} image:`, outfit.image)
        })
        
        setOutfits(outfitData)
      } else {
        console.error('Failed to fetch outfits, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching outfits:', error)
    } finally {
      setIsLoadingOutfits(false)
    }
  }

  useEffect(() => {
    fetchOutfits()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOutfits()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleLike = async (outfitId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    try {
      setOutfits(prevOutfits => 
        prevOutfits.map(outfit => 
          outfit.id === outfitId 
            ? { ...outfit, liked: !outfit.liked }
            : outfit
        )
      )

      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/${outfitId}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        setOutfits(prevOutfits => 
          prevOutfits.map(outfit => 
            outfit.id === outfitId 
              ? { ...outfit, liked: !outfit.liked }
              : outfit
          )
        )
      }
    } catch (error) {
      console.error('Error liking outfit:', error)
      setOutfits(prevOutfits => 
        prevOutfits.map(outfit => 
          outfit.id === outfitId 
            ? { ...outfit, liked: !outfit.liked }
            : outfit
        )
      )
    }
  }

  const addOutfit = async (formData: FormData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const responseData = await response.json()
        // Handle both old and new response formats
        const newOutfit = responseData.outfit || responseData
        setOutfits(prev => [newOutfit, ...prev])
        return newOutfit
      } else {
        console.error('Failed to add outfit:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return null
      }
    } catch (error) {
      console.error('Error adding outfit:', error)
      return null
    }
  }

  const updateOutfit = async (outfitId: string, formData: FormData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const responseData = await response.json()
        // Handle both old and new response formats
        const updatedOutfit = responseData.outfit || responseData
        setOutfits(prevOutfits => 
            prevOutfits.map(outfit => outfit.id === outfitId ? updatedOutfit : outfit)
        )
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

  const deleteOutfit = async (outfitId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token for delete')
      return false
    }

    try {
      console.log(`🗑️ Deleting outfit ${outfitId}...`)
      
      // Store reference to current outfits for potential restore
      let originalOutfits: Outfit[] = []
      
      // Remove from local state immediately for better UX
      setOutfits(prevOutfits => {
        originalOutfits = prevOutfits // Store the original state
        const filtered = prevOutfits.filter(outfit => outfit.id !== outfitId)
        console.log(`Optimistically removed outfit. Count: ${filtered.length} (was ${prevOutfits.length})`)
        return filtered
      })
      
      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log(`Delete response status: ${response.status}`)
      console.log(`Delete response ok: ${response.ok}`)

      // DELETE requests typically return 204 (No Content) or 200
      if (response.ok || response.status === 204) {
        console.log(`✅ Delete confirmed successful for outfit ${outfitId}`)
        return true
      } else {
        console.error(`❌ Delete failed for outfit ${outfitId}:`, response.status)
        
        // Restore the outfit to state since delete failed
        setOutfits(originalOutfits)
        
        // Try to get error details
        try {
          const errorText = await response.text()
          console.error('Delete error response:', errorText)
        } catch (e) {
          console.error('Could not read error response')
        }
        
        return false
      }
    } catch (error: any) {
      console.error(`❌ Delete exception for outfit ${outfitId}:`, error)
      
      // If there's a network error but the outfit might have been deleted,
      // let's assume success after a timeout (similar to upload logic)
      if (error?.name === 'TypeError' || error?.message?.includes('Failed to fetch')) {
        console.log('Network error during delete - will verify success after delay')
        
        // Wait a moment then check if outfit was actually deleted
        setTimeout(async () => {
          try {
            await fetchOutfits() // This will refresh the entire list from server
          } catch (e) {
            console.error('Could not verify delete status:', e)
          }
        }, 2000)
        
        // Return true optimistically
        return true
      }
      
      // For other errors, restore state and return false
      setOutfits(prevOutfits => {
        // If we can't restore original, just refetch
        fetchOutfits()
        return prevOutfits
      })
      return false
    }
  }

  return {
    outfits,
    isLoadingOutfits,
    fetchOutfits,
    handleLike,
    addOutfit,
    updateOutfit,
    deleteOutfit
  }
}