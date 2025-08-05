'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, Plus, Shirt, Camera, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
// CORRECTED IMPORT PATHS:
import Sidebar from '../../app/components/shared/Sidebar'
import SettingsModal from './components/SettingsModal'
import OutfitCreator from './components/OutfitCreator'
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

// Add API URL configuration
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

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const token = localStorage.getItem('authToken')
      // FIXED: Use environment variable instead of hardcoded localhost
      const response = await fetch(`${API_URL}/api/auth/upload-avatar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setUser(prevUser => {
          if (!prevUser) return null
          const updatedUser = { ...prevUser, avatar: data.avatar }
          localStorage.setItem('userProfile', JSON.stringify(updatedUser))
          return updatedUser
        })
      } else {
        alert(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image. Please try again.')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Fetch outfits from database
  const fetchOutfits = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.log('❌ No auth token found for outfits')
      setIsLoadingOutfits(false)
      setOutfitsError('Please log in to view your outfits')
      return
    }

    try {
      setIsLoadingOutfits(true)
      setOutfitsError('')
      console.log('🔄 Fetching saved outfits from database...')
      
      const response = await fetch(`${API_URL}/api/auth/outfits/?category=Saved`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Outfits fetch response status:', response.status)

      if (response.ok) {
        const outfitsData = await response.json()
        console.log('✅ Fetched outfits from database:', outfitsData.length)
        
        const transformedOutfits = outfitsData.map((outfit: any) => {
          // The API now returns full item details, so we just use them directly.
          return {
            id: outfit.id.toString(),
            title: outfit.title,
            description: outfit.description || '',
            items: outfit.items || [], // Items are already complete objects
            thumbnail: (outfit.items && outfit.items[0]) ? outfit.items[0].image : '',
            createdAt: outfit.created_at,
            isFavorite: outfit.is_favorite || false
          };
        });
        
        setSavedOutfits(transformedOutfits)
        console.log('✅ Outfits loaded and transformed successfully')
        
      } else {
        const errorText = await response.text()
        console.log('❌ Failed to fetch outfits from database:', errorText)
        setOutfitsError('Failed to load saved outfits from server')
      }
    } catch (error) {
      console.error('❌ Network error fetching outfits:', error)
      setOutfitsError('Network error loading outfits')
    } finally {
      setIsLoadingOutfits(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    const cached = localStorage.getItem('userProfile')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch (e) {
        console.error('Error parsing cached user data:', e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          console.log('No auth token found')
          return
        }

        // FIXED: Use environment variable instead of hardcoded localhost
        const response = await fetch(`${API_URL}/api/auth/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setError(null)
          setIsOfflineMode(false)

          localStorage.setItem('userProfile', JSON.stringify(userData))
          localStorage.setItem('username', userData.username)
        } else if (response.status === 401) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('userProfile')
          localStorage.removeItem('username')
          console.log('Auth token invalid')
        } else {
          throw new Error('Failed to load profile from server')
        }
      } catch (error) {
        console.error('Network error:', error)
        
        setIsOfflineMode(true)
        setError('Offline mode - showing cached data')
      }
    }

    if (isClient) {
      fetchUserProfile()
      // Fetch outfits when component mounts
      fetchOutfits()
    }
  }, [isClient])

  const updateUserData = (updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null
      const newUser = { ...prevUser, ...updatedData }

      localStorage.setItem('userProfile', JSON.stringify(newUser))
      if (updatedData.username) {
        localStorage.setItem('username', updatedData.username)
      }
      if (updatedData.bio !== undefined) {
        localStorage.setItem('userBio', updatedData.bio)
      }

      return newUser
    })
  }

  const handleSaveOutfit = (newOutfit: Outfit) => {
    const updatedOutfits = [newOutfit, ...savedOutfits]
    setSavedOutfits(updatedOutfits)
  }

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        // Try to delete from database
        const response = await fetch(`${API_URL}/api/auth/outfits/${outfitId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          console.log('✅ Outfit deleted from database')
        } else {
          console.log('❌ Failed to delete from database, removing locally only')
        }
      }
    } catch (error) {
      console.error('Error deleting outfit from database:', error)
    }
    
    // Always remove from local state
    const updatedOutfits = savedOutfits.filter(outfit => outfit.id !== outfitId)
    setSavedOutfits(updatedOutfits)
  }

  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfitForView(outfit)
    setShowOutfitModal(true)
  }

  const handleCloseOutfitModal = () => {
    setShowOutfitModal(false)
    setSelectedOutfitForView(null)
  }

  const handleGoBack = () => {
    router.back()
  }

  // Function to refresh outfits (useful for debugging)
  const refreshOutfits = () => {
    fetchOutfits()
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        <div className="w-20 bg-[#0B2C21]"></div>
        <div className="flex-1"></div>
      </div>
    )
  }

  const filteredOutfits = savedOutfits
    .filter(outfit => 
      searchQuery === '' || 
      outfit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

  return (
    <>
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal || showOutfitCreator || showOutfitModal ? 'blur-sm' : ''}`}>
        
        <Sidebar 
          user={user} 
          onShowSettings={() => setShowSettingsModal(true)}
        />

        <div className="flex-1">
          <div className="flex items-center pl-24 pr-6 py-6 space-x-6">
            <ArrowLeft 
              className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800 transition-colors flex-shrink-0" 
              onClick={handleGoBack} 
            />
            
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your outfits"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[85%] bg-white border border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {error && (
            <div className={`ml-32 mr-12 mb-4 p-3 rounded ${
              isOfflineMode 
                ? 'bg-blue-100 border border-blue-400 text-blue-800' 
                : 'bg-yellow-100 border border-yellow-400 text-yellow-800'
            }`}>
              <p style={{ fontFamily: 'Inter', fontSize: '14px' }}>
                {error}
                {isOfflineMode && ' - Changes will be saved locally'}
              </p>
            </div>
          )}

          {/* Outfits Error Display */}
          {outfitsError && (
            <div className="ml-32 mr-12 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm" style={{ fontFamily: 'Inter' }}>
                {outfitsError}
              </p>
              <button 
                onClick={refreshOutfits}
                className="text-red-800 hover:underline text-sm mt-2"
              >
                Try again
              </button>
            </div>
          )}

          <ProfileHeader
            user={user}
            triggerFileSelect={triggerFileSelect}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            setShowOutfitCreator={() => setShowOutfitCreator(true)}
            setActiveTab={setActiveTab}
          />

          <div className="pl-32 pr-12">
            {activeTab === 'outfits' && (
              <div className="pb-6">
                {/* Loading state */}
                {isLoadingOutfits ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>Loading your outfits...</p>
                  </div>
                ) : filteredOutfits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shirt className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      No outfits yet
                    </h3>
                    <p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
                      Create your first outfit to start building your style collection
                    </p>

                    {outfitsError && (
                      <button 
                        onClick={refreshOutfits}
                        className="px-4 py-2 bg-[#0B2C21] text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ fontFamily: 'Inter' }}
                      >
                        Retry Loading Outfits
                      </button>
                    )}

                    {isOfflineMode && (
                      <div className="mt-4 text-sm text-blue-600">
                        <p>Working offline - your changes are saved locally</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 justify-items-center">
                    {filteredOutfits.map((outfit) => (
                      <div 
                        key={outfit.id} 
                        className="bg-white rounded-xl shadow-lg overflow-hidden group relative cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out w-full max-w-xs"
                        onClick={() => handleViewOutfit(outfit)}
                      >
                        
                        <div className="relative h-80 bg-gray-50 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center p-4">
                            {outfit.items.length === 1 ? (
                              <div className="w-full h-full max-w-48">
                                {outfit.items[0].image ? (
                                  <img
                                    src={outfit.items[0].image}
                                    alt={outfit.items[0].name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                                    <Shirt className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            ) : outfit.items.length === 2 ? (
                              <div className="grid grid-cols-2 gap-3 w-full h-full max-w-64">
                                {outfit.items.slice(0, 2).map((item, index) => (
                                  <div 
                                    key={item.id} 
                                    className="relative h-full"
                                    style={{
                                      transform: `rotate(${index === 0 ? -1 : 1}deg)`,
                                    }}
                                  >
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm">
                                        <Shirt className="w-8 h-8 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : outfit.items.length === 3 ? (
                              <div className="grid grid-cols-2 gap-3 w-full h-full max-w-72">
                                <div 
                                  className="relative row-span-2"
                                  style={{ transform: 'rotate(-1deg)' }}
                                >
                                  {outfit.items[0].image ? (
                                    <img
                                      src={outfit.items[0].image}
                                      alt={outfit.items[0].name}
                                      className="w-full h-full object-cover rounded-lg shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm">
                                      <Shirt className="w-8 h-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-rows-2 gap-2">
                                  {outfit.items.slice(1, 3).map((item, index) => (
                                    <div 
                                      key={item.id}
                                      className="relative"
                                      style={{
                                        transform: `rotate(${index === 0 ? 2 : -1}deg)`,
                                      }}
                                    >
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover rounded-lg shadow-sm"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm">
                                          <Shirt className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-3 w-full h-full max-w-80">
                                {outfit.items.slice(0, 4).map((item, index) => (
                                  <div 
                                    key={item.id} 
                                    className="relative"
                                    style={{
                                      transform: `rotate(${[-1, 1, -0.5, 0.5][index]}deg)`,
                                    }}
                                  >
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg shadow-sm">
                                        <Shirt className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                    {index === 3 && outfit.items.length > 4 && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                        <span className="text-white font-bold text-sm">
                                          +{outfit.items.length - 4}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteOutfit(outfit.id)
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Delete outfit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="p-4 bg-white">
                          <h4 className="text-gray-900 font-semibold text-lg mb-2 truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {outfit.title}
                          </h4>
                          
                          <div className="mb-3">
                            <span className="inline-block bg-[#0B2C21] text-white text-xs px-3 py-1 rounded-full">
                              {outfit.items.length} items
                            </span>
                          </div>
                          
                          {outfit.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3" style={{ fontFamily: 'Inter' }}>
                              {outfit.description}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-700" style={{ fontFamily: 'Inter' }}>
                            {new Date(outfit.createdAt).toLocaleDateString()}
                          </p>
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

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        currentUser={user}
        onUserUpdate={updateUserData}
        isOfflineMode={isOfflineMode}
      />

      <OutfitCreator
        isOpen={showOutfitCreator}
        onClose={() => setShowOutfitCreator(false)}
        onSaveOutfit={handleSaveOutfit}
      />

      <OutfitViewModal
        isOpen={showOutfitModal}
        onClose={handleCloseOutfitModal}
        outfit={selectedOutfitForView}
      />
    </>
  )
}