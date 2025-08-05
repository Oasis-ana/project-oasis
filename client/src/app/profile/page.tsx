'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, Plus, Shirt, Camera, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '../../app/components/shared/Sidebar'
import SettingsModal from './components/SettingsModal'
// Import the new data type from the creator component
import OutfitCreator, { NewOutfitData } from './components/OutfitCreator'
import OutfitViewModal from './components/OutfitViewModal'
import ProfileHeader from './components/ProfileHeader'

interface User {
  username: string
  email: string
  first_name: string
  last_name: string
  bio: string
  avatar?: string
  followers_count?: number
  following_count?: number
}

interface ClothingItem {
  id: string
  name: string
  brand: string
  size: string
  color: string
  category: string
  image: string
  tags: string[]
  isFavorite: boolean
  isWorn: boolean
  lastWorn?: string
  createdAt: string
}

interface Outfit {
  id: string
  title: string
  description: string
  items: ClothingItem[]
  thumbnail: string
  createdAt: string
  isFavorite?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function ProfilePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showOutfitCreator, setShowOutfitCreator] = useState(false)
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('outfits')
  const [selectedOutfitForView, setSelectedOutfitForView] = useState<Outfit | null>(null)
  const [showOutfitModal, setShowOutfitModal] = useState(false)
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true)
  const [outfitsError, setOutfitsError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    // Fetch initial data on component mount
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem('userProfile')
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser))
        } catch (e) { console.error('Error parsing cached user data:', e) }
      }
      fetchUserProfile()
      fetchOutfits()
    }
  }, [])

  const fetchUserProfile = async () => {
    // ... existing fetchUserProfile function is unchanged
    try {
      const token = localStorage.getItem('authToken')
      if (!token) { console.log('No auth token found'); return }
      const response = await fetch(`${API_URL}/api/auth/profile/`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setError(null)
        setIsOfflineMode(false)
        localStorage.setItem('userProfile', JSON.stringify(userData))
      } else { throw new Error('Failed to load profile from server') }
    } catch (error) {
      console.error('Network error:', error)
      setIsOfflineMode(true)
      setError('Offline mode - showing cached data')
    }
  }

  const fetchOutfits = async () => {
    // ... existing fetchOutfits function is unchanged
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingOutfits(false)
      setOutfitsError('Please log in to view your outfits')
      return
    }
    try {
      setIsLoadingOutfits(true)
      setOutfitsError('')
      const response = await fetch(`${API_URL}/api/auth/outfits/?category=Saved`, {
        headers: { 'Authorization': `Token ${token}` }
      })
      if (response.ok) {
        const outfitsData = await response.json()
        const transformedOutfits = outfitsData.map((outfit: any) => ({
          id: outfit.id.toString(),
          title: outfit.title,
          description: outfit.description || '',
          items: outfit.items || [],
          thumbnail: (outfit.items && outfit.items[0]) ? outfit.items[0].image : '',
          createdAt: outfit.created_at,
          isFavorite: outfit.is_favorite || false
        }));
        setSavedOutfits(transformedOutfits)
      } else { setOutfitsError('Failed to load saved outfits from server') }
    } catch (error) { setOutfitsError('Network error loading outfits') } 
    finally { setIsLoadingOutfits(false) }
  }

  const handleSaveOutfit = async (newOutfitData: NewOutfitData) => {
    // Create a temporary ID for the optimistic update
    const tempId = `temp-${Date.now()}`
    
    // Create a temporary outfit object to show in the UI immediately
    const optimisticOutfit: Outfit = {
      id: tempId,
      title: newOutfitData.title,
      description: newOutfitData.description,
      items: newOutfitData.items,
      thumbnail: newOutfitData.items[0]?.image || '',
      createdAt: new Date().toISOString(),
      isFavorite: false
    }

    // 1. Optimistically update the UI
    setSavedOutfits(prev => [optimisticOutfit, ...prev])
    setOutfitsError('') // Clear previous errors

    try {
      // 2. Perform the actual API call in the background
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('Authentication token not found.')

      const apiOutfitData = {
        title: newOutfitData.title,
        description: newOutfitData.description,
        items: newOutfitData.items.map(item => parseInt(item.id)), // Send only IDs
        category: newOutfitData.category,
        tags: newOutfitData.tags,
      }

      const response = await fetch(`${API_URL}/api/auth/outfits/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiOutfitData)
      })

      if (!response.ok) {
        // If the save fails, throw an error to be caught below
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to save outfit to server.')
      }

      const savedOutfitFromServer = await response.json()

      // 3. Reconcile: Replace the temporary outfit with the real one from the server
      setSavedOutfits(prev =>
        prev.map(outfit =>
          outfit.id === tempId ? {
            ...outfit,
            id: savedOutfitFromServer.id.toString(), // Use the real ID
            createdAt: savedOutfitFromServer.created_at // Use the real timestamp
          } : outfit
        )
      )
    } catch (error) {
      console.error("Failed to save outfit:", error)
      // 4. Rollback: If the save failed, remove the temporary outfit from the UI
      setSavedOutfits(prev => prev.filter(outfit => outfit.id !== tempId))
      // And show an error message to the user
      setOutfitsError('Could not save outfit. Please try again.')
    }
  }
  
  // All other functions and JSX remain the same...
  const updateUserData = (updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null
      const newUser = { ...prevUser, ...updatedData }
      localStorage.setItem('userProfile', JSON.stringify(newUser))
      return newUser
    })
  }
  const handleDeleteOutfit = async (outfitId: string) => {
    const originalOutfits = [...savedOutfits]
    setSavedOutfits(prev => prev.filter(outfit => outfit.id !== outfitId))
    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error("No auth token")
      const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      })
      if (!response.ok) {
        // Revert on failure
        setSavedOutfits(originalOutfits)
        setOutfitsError("Failed to delete outfit.")
      }
    } catch (error) {
      console.error('Error deleting outfit:', error)
      setSavedOutfits(originalOutfits)
      setOutfitsError("Failed to delete outfit.")
    }
  }
  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfitForView(outfit)
    setShowOutfitModal(true)
  }
  const handleCloseOutfitModal = () => {
    setShowOutfitModal(false)
    setSelectedOutfitForView(null)
  }
  const handleGoBack = () => router.back()
  const triggerFileSelect = () => fileInputRef.current?.click()
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { handleAvatarUpload(file) }
  }
  const handleAvatarUpload = async (file: File) => {
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_URL}/api/auth/upload-avatar/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData
      })
      const data = await response.json()
      if (response.ok) {
        updateUserData({ avatar: data.avatar })
      } else { alert(data.error || 'Failed to upload image') }
    } catch (error) { console.error('Image upload error:', error) }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        <div className="w-20 bg-[#0B2C21]"></div>
        <div className="flex-1"></div>
      </div>
    )
  }

  const filteredOutfits = savedOutfits.filter(outfit => searchQuery === '' || outfit.title.toLowerCase().includes(searchQuery.toLowerCase()) || outfit.description.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal || showOutfitCreator || showOutfitModal ? 'blur-sm' : ''}`}>
        <Sidebar user={user} onShowSettings={() => setShowSettingsModal(true)} />
        <div className="flex-1">
          <div className="flex items-center pl-24 pr-6 py-6 space-x-6">
            <ArrowLeft className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors flex-shrink-0" onClick={handleGoBack} />
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search your outfits" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[85%] bg-white border border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400" />
            </div>
          </div>
          {outfitsError && (
            <div className="ml-32 mr-12 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm" style={{ fontFamily: 'Inter' }}>{outfitsError}</p>
            </div>
          )}
          <ProfileHeader user={user} triggerFileSelect={triggerFileSelect} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect} setShowOutfitCreator={() => setShowOutfitCreator(true)} setActiveTab={setActiveTab} />
          <div className="pl-32 pr-12">
            {activeTab === 'outfits' && (
              <div className="pb-6">
                {isLoadingOutfits ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600" style={{ fontFamily: 'Inter' }}>Loading your outfits...</p></div>
                ) : filteredOutfits.length === 0 ? (
                  <div className="text-center py-12"><div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4"><Shirt className="w-8 h-8 text-gray-400" /></div><h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>No outfits yet</h3><p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>Create your first outfit to start building your style collection</p></div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 justify-items-center">
                    {filteredOutfits.map((outfit) => (
                      <div key={outfit.id} className="bg-white rounded-xl shadow-lg overflow-hidden group relative cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-xs" onClick={() => handleViewOutfit(outfit)}>
                        <div className="relative h-80 bg-gray-50 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            {/* The complex image grid logic remains unchanged */}
                            {outfit.items.length === 1 ? (<div className="w-full h-full max-w-48">{outfit.items[0].image ? (<img src={outfit.items[0].image} alt={outfit.items[0].name} className="w-full h-full object-cover rounded-lg" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg"><Shirt className="w-12 h-12 text-gray-400" /></div>)}</div>) : outfit.items.length === 2 ? (<div className="grid grid-cols-2 gap-3 w-full h-full max-w-64">{outfit.items.slice(0, 2).map((item, index) => (<div key={item.id} className="relative h-full" style={{ transform: `rotate(${index === 0 ? -1 : 1}deg)` }}>{item.image ? (<img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg shadow-sm" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm"><Shirt className="w-8 h-8 text-gray-400" /></div>)}</div>))}</div>) : outfit.items.length === 3 ? (<div className="grid grid-cols-2 gap-3 w-full h-full max-w-72"><div className="relative row-span-2" style={{ transform: 'rotate(-1deg)' }}>{outfit.items[0].image ? (<img src={outfit.items[0].image} alt={outfit.items[0].name} className="w-full h-full object-cover rounded-lg shadow-sm" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm"><Shirt className="w-8 h-8 text-gray-400" /></div>)}</div><div className="grid grid-rows-2 gap-2">{outfit.items.slice(1, 3).map((item, index) => (<div key={item.id} className="relative" style={{ transform: `rotate(${index === 0 ? 2 : -1}deg)` }}>{item.image ? (<img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg shadow-sm" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm"><Shirt className="w-6 h-6 text-gray-400" /></div>)}</div>))}</div></div>) : (<div className="grid grid-cols-2 gap-3 w-full h-full max-w-80">{outfit.items.slice(0, 4).map((item, index) => (<div key={item.id} className="relative" style={{ transform: `rotate(${[-1, 1, -0.5, 0.5][index]}deg)` }}>{item.image ? (<img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg shadow-sm" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm"><Shirt className="w-6 h-6 text-gray-400" /></div>)}{index === 3 && outfit.items.length > 4 && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"><span className="text-white font-bold text-sm">+{outfit.items.length - 4}</span></div>)}</div>))}</div>)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteOutfit(outfit.id) }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10" title="Delete outfit"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-4 bg-white">
                          <h4 className="text-gray-900 font-semibold text-lg mb-2 truncate" style={{ fontFamily: 'Playfair Display, serif' }}>{outfit.title}</h4>
                          <div className="mb-3"><span className="inline-block bg-[#0B2C21] text-white text-xs px-3 py-1 rounded-full">{outfit.items.length} items</span></div>
                          {outfit.description && (<p className="text-sm text-gray-600 line-clamp-2 mb-3" style={{ fontFamily: 'Inter' }}>{outfit.description}</p>)}
                          <p className="text-xs text-gray-700" style={{ fontFamily: 'Inter' }}>{new Date(outfit.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} currentUser={user} onUserUpdate={updateUserData} isOfflineMode={isOfflineMode} />
      <OutfitCreator isOpen={showOutfitCreator} onClose={() => setShowOutfitCreator(false)} onSaveOutfit={handleSaveOutfit} />
      <OutfitViewModal isOpen={showOutfitModal} onClose={handleCloseOutfitModal} outfit={selectedOutfitForView} />
    </>
  )
}
