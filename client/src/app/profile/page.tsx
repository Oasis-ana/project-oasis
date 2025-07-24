'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Search, Home, Camera, Bell, Settings } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import SettingsModal from './SettingsModal'

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

export default function ProfilePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load cached data immediately on client side
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

  // Fetch fresh data in background
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('http://localhost:8000/api/auth/profile/', {
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
          router.push('/login')
        } else {
          throw new Error('Failed to load profile from server')
        }
      } catch (error) {
        console.error('Network error:', error)
        // Keep cached data, show offline mode
        setIsOfflineMode(true)
        setError('Offline mode - showing cached data')
      }
    }

    if (isClient) {
      fetchUserProfile()
    }
  }, [router, isClient])

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

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        <div className="w-20 bg-[#0B2C21]"></div>
        <div className="flex-1"></div>
      </div>
    )
  }

  return (
    <>
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal ? 'blur-sm' : ''}`}>
        <div className="w-20 bg-[#0B2C21] flex flex-col items-center py-8">
          <div className="w-12 h-12 rounded-full mb-12 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-orange-600"></div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center flex-1">
            {/* Home Icon - Fixed to go to /home */}
            <div className="flex items-center justify-center mb-14">
              <Home className="w-6 h-6 text-white cursor-pointer" onClick={() => router.push('/home')} />
            </div>

            {/* Hanger Icon - Now navigates to closet */}
            <div 
              className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14"
              onClick={() => router.push('/closet')}
            >
              <img
                src="/hanger-for-sidebar.png?v=2"
                alt="Hanger"
                className="object-contain"
                style={{
                  filter: 'brightness(0) invert(1)',
                  width: '32px',
                  height: '32px'
                }}
              />
            </div>

            {/* Camera Icon */}
            <div className="flex items-center justify-center mb-14">
              <Camera className="w-6 h-6 text-white cursor-pointer hover:text-gray-300" />
            </div>

            {/* Bell Icon */}
            <div className="flex items-center justify-center">
              <Bell className="w-6 h-6 text-white cursor-pointer hover:text-gray-300" />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Settings 
              className="w-6 h-6 text-white cursor-pointer hover:text-gray-300" 
              onClick={() => setShowSettingsModal(true)}
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center p-6 space-x-4">
            <ArrowLeft className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800" onClick={() => router.back()} />
            
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
            <div className={`mx-6 mb-4 p-3 rounded ${
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

          <div className="text-center px-6 mb-8">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-400 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-600"></div>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              {user?.username?.toUpperCase() || 'USERNAME'}
            </h1>

            <p className="text-gray-600">
              {user?.bio || 'You write your bio here'}
            </p>
          </div>

          <div className="px-6">
            <div className="text-center py-8">
              <p className="text-gray-600">No outfits yet. Start uploading your style!</p>

              {isOfflineMode && (
                <div className="mt-4 text-sm text-blue-600">
                  <p>Working offline - your changes are saved locally</p>
                </div>
              )}
            </div>
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
    </>
  )
}