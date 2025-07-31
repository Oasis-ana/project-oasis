'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Outfit } from '../types/outfit'

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
      const response = await fetch('http://localhost:8000/api/auth/outfits/', {
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

      const response = await fetch(`http://localhost:8000/api/auth/outfits/${outfitId}/like/`, {
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
      const response = await fetch('http://localhost:8000/api/auth/outfits/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const newOutfit = await response.json() as Outfit
        setOutfits(prev => [newOutfit, ...prev])
        return newOutfit
      } else {
        console.error('Failed to add outfit:', response.status)
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
      const response = await fetch(`http://localhost:8000/api/auth/outfits/${outfitId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const updatedOutfit = await response.json() as Outfit
        setOutfits(prevOutfits => 
            prevOutfits.map(outfit => outfit.id === outfitId ? updatedOutfit : outfit)
        )
        return updatedOutfit
      } else {
        console.error('Failed to update outfit:', response.status)
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
      return false
    }

    try {
      const response = await fetch(`http://localhost:8000/api/auth/outfits/${outfitId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        }
      })

      if (response.ok) {
        setOutfits(prevOutfits => prevOutfits.filter(outfit => outfit.id !== outfitId))
        return true
      } else {
        console.error('Failed to delete outfit:', response.status)
        return false
      }
    } catch (error) {
      console.error('Error deleting outfit:', error)
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