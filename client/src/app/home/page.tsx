'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, X, Heart, Trash2, Edit, Camera, Upload, Home, Bell, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOutfits } from '../hooks/useOutfits'
import { useCamera } from '../hooks/useCamera'
import SettingsModal from '../profile/components/SettingsModal'
import OutfitGrid from '../home/components/OutfitGrid'
import Sidebar from '../components/shared/Sidebar'
import { Outfit } from '../types/outfit'

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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAddTabModal, setShowAddTabModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tabToDelete, setTabToDelete] = useState('')
  const [newTabName, setNewTabName] = useState('')
  const [defaultTabs, setDefaultTabs] = useState<string[]>(['Work', 'Date Night'])
  const [customTabs, setCustomTabs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('All Outfits')
  const [isClient, setIsClient] = useState(false)
  
  
  const [showCreateOutfitModal, setShowCreateOutfitModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [outfitData, setOutfitData] = useState({
    title: '',
    description: '',
    category: 'Casual',
    tags: '',
    occasion: ''
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [showOutfitModal, setShowOutfitModal] = useState(false)
  
 
  const [isEditing, setIsEditing] = useState(false)
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null)
  
  
  const [showDeleteOutfitModal, setShowDeleteOutfitModal] = useState(false)
  const [outfitToDelete, setOutfitToDelete] = useState<Outfit | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { outfits, isLoadingOutfits, fetchOutfits, handleLike, addOutfit, updateOutfit, deleteOutfit } = useOutfits()
  const { showCamera, videoRef, canvasRef, startCamera, stopCamera, takePhoto } = useCamera()

  // Base categories
  const baseCategories = ['Casual', 'Work', 'Date Night', 'Formal', 'Party', 'Weekend', 'Travel', 'Sport']
  
  
  const allCategories = Array.from(new Set([...baseCategories, ...defaultTabs, ...customTabs]));

  // Load cached data
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

    const savedTabs = localStorage.getItem('customTabs')
    if (savedTabs) {
      try {
        setCustomTabs(JSON.parse(savedTabs))
      } catch (e) {
        console.error('Error parsing custom tabs:', e)
      }
    }

    const savedDefaultTabs = localStorage.getItem('defaultTabs')
    if (savedDefaultTabs) {
      try {
        setDefaultTabs(JSON.parse(savedDefaultTabs))
      } catch (e) {
        console.error('Error parsing default tabs:', e)
      }
    }

    
    const pendingImage = localStorage.getItem('pendingOutfitImage')
    if (pendingImage) {
      setSelectedImage(pendingImage)
      setShowCreateOutfitModal(true)
      localStorage.removeItem('pendingOutfitImage')
    }

    
    const shouldCreateOutfit = localStorage.getItem('shouldCreateOutfit')
    if (shouldCreateOutfit) {
      setShowCreateOutfitModal(true)
      localStorage.removeItem('shouldCreateOutfit')
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchUserProfile()
    }
  }, [isClient])

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

 
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

    try {
      
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
        localStorage.setItem('userProfile', JSON.stringify(userData))
      } else if (response.status === 401) {
        localStorage.removeItem('authToken')
        router.push('/login')
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  const updateUserData = (updatedData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null
      const newUser = { ...prevUser, ...updatedData }
      localStorage.setItem('userProfile', JSON.stringify(newUser))
      return newUser
    })
  }

  
  const tabs = ['All Outfits', 'Favorites', ...defaultTabs, ...customTabs, '+ Add Tab']
  
  
  const tabFilteredOutfits = activeTab === 'All Outfits' 
    ? outfits 
    : activeTab === 'Favorites'
    ? outfits.filter(outfit => outfit.liked)
    : outfits.filter(outfit => outfit.category === activeTab);

  
  const filteredOutfits = tabFilteredOutfits.filter(outfit => {
    if (searchQuery === '') {
      return true; 
    }

    const query = searchQuery.toLowerCase();
    const title = outfit.title.toLowerCase();
    const description = outfit.description?.toLowerCase() || '';
    const tags = outfit.tags?.map(tag => tag.toLowerCase()).join(' ') || '';

    return (
      title.includes(query) ||
      description.includes(query) ||
      tags.includes(query)
    );
  });

  const handleTabClick = (tab: string) => {
    if (tab === '+ Add Tab') {
      setShowAddTabModal(true)
    } else {
      setActiveTab(tab)
    }
  }

  const handleCreateTab = async () => {
    if (!newTabName.trim()) return

    const tabName = newTabName.trim()
    
    if (['All Outfits', 'Favorites', ...defaultTabs, ...customTabs].includes(tabName)) {
      alert('This tab already exists!')
      return
    }

    const newCustomTabs = [...customTabs, tabName]
    setCustomTabs(newCustomTabs)
    localStorage.setItem('customTabs', JSON.stringify(newCustomTabs))
    
    setShowAddTabModal(false)
    setNewTabName('')
    setActiveTab(tabName)
  }

  const handleDeleteTab = (tabToDelete: string) => {
    if (tabToDelete === 'All Outfits' || tabToDelete === 'Favorites') return
    setTabToDelete(tabToDelete)
    setShowDeleteModal(true)
  }

  const confirmDeleteTab = () => {
    if (defaultTabs.includes(tabToDelete)) {
      const updatedDefaultTabs = defaultTabs.filter(tab => tab !== tabToDelete)
      setDefaultTabs(updatedDefaultTabs)
      localStorage.setItem('defaultTabs', JSON.stringify(updatedDefaultTabs))
    } else {
      const updatedCustomTabs = customTabs.filter(tab => tab !== tabToDelete)
      setCustomTabs(updatedCustomTabs)
      localStorage.setItem('customTabs', JSON.stringify(updatedCustomTabs))
    }
    
    if (activeTab === tabToDelete) {
      setActiveTab('All Outfits')
    }

    setShowDeleteModal(false)
    setTabToDelete('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTakePhoto = () => {
    const imageData = takePhoto()
    if (imageData) {
      setSelectedImage(imageData)
    }
  }
  
  const handleLogTodaysLook = () => {
    resetOutfitForm()
    setShowCreateOutfitModal(true)
    if (activeTab !== 'All Outfits') {
      setOutfitData(prev => ({
        ...prev,
        category: activeTab
      }))
    } else {
      setOutfitData(prev => ({
        ...prev,
        category: baseCategories[0]
      }))
    }
  }
  
  const handleEditOutfit = (outfit: Outfit) => {
    setIsEditing(true)
    setEditingOutfitId(outfit.id)
    setSelectedImage(outfit.image)
    setOutfitData({
      title: outfit.title,
      description: outfit.description || '',
      category: outfit.category,
      tags: outfit.tags ? outfit.tags.join(', ') : '',
      occasion: outfit.occasion || ''
    })
    setShowCreateOutfitModal(true)
    setShowOutfitModal(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setOutfitData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOutfitClick = (outfit: Outfit) => {
    setSelectedOutfit(outfit)
    setShowOutfitModal(true)
  }

  const closeOutfitModal = () => {
    setSelectedOutfit(null)
    setShowOutfitModal(false)
  }

  const validateForm = () => {
    if (!selectedImage) {
      alert('Please add a photo of your outfit')
      return false
    }
    if (!outfitData.title.trim()) {
      alert('Please enter an outfit title')
      return false
    }
    return true
  }

  const handleCloseSuccessModal = () => {
    setSuccessMessage(null);
  }

  
  const handleSuccess = (message: string) => {
    setShowCreateOutfitModal(false);
    setSuccessMessage('Outfit Posted! 🎉'); // Fixed message like before
    resetOutfitForm(); 
    setTimeout(() => {
      handleCloseSuccessModal();
    }, 2000);
  }

  
  const handleCloseCreateModal = () => {
    setShowCreateOutfitModal(false)
    resetOutfitForm()
  }

  // NEW: Verification function to check if upload actually succeeded
  const verifyUploadSuccess = async () => {
    try {
      console.log('Verifying upload success...')
      
      // Refresh the outfits list to see if the new outfit appears
      await fetchOutfits()
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if our outfit was added by looking for matching title
      const recentOutfits = outfits.filter(outfit => 
        outfit.title === outfitData.title && 
        new Date(outfit.created_at).getTime() > Date.now() - 5 * 60 * 1000 // Created within last 5 minutes
      )
      
      if (recentOutfits.length > 0) {
        console.log('Upload verification successful!')
        handleSuccess(isEditing ? 'Outfit updated!' : 'Outfit saved!')
        return
      }
      
      // If we can't verify success, show an error but suggest checking manually
      alert('Upload status unclear. Please check your outfits list - your outfit may have been saved successfully.')
    } catch (error) {
      console.error('Error verifying upload:', error)
      alert('Could not verify upload status. Please refresh the page to check if your outfit was saved.')
    } finally {
      setIsUploading(false)
    }
  }

  // IMPROVED: Better upload handling with verification
  const handleSaveOrUpdateOutfit = async () => {
    if (!validateForm()) return

    // Prevent multiple uploads
    if (isUploading) {
      console.log('Upload already in progress, ignoring duplicate request')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    const formData = new FormData()
    formData.append('title', outfitData.title)
    
    if (outfitData.description) {
      formData.append('description', outfitData.description)
    }
    
    formData.append('category', outfitData.category)
    
    const tagsArray = outfitData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    tagsArray.forEach(tag => {
      formData.append('tags', tag)
    })
    
    if (outfitData.occasion) {
      formData.append('occasion', outfitData.occasion)
    }
    
    if (selectedImage && selectedImage.startsWith('data:')) {
      const base64Response = await fetch(selectedImage)
      const blob = await base64Response.blob()
      formData.append('image', blob, 'outfit.jpg')
    }

    try {
      let success = false
      let result = null
      
      // Simulate progress for better UX
      setUploadProgress(25)
      
      if (isEditing && editingOutfitId) {
        setUploadProgress(50)
        result = await updateOutfit(editingOutfitId, formData)
        success = !!result
      } else {
        setUploadProgress(50)
        result = await addOutfit(formData)
        success = !!result
      }
      
      setUploadProgress(75)
      
      if (success) {
        setUploadProgress(100)
        const message = isEditing ? 'Outfit updated!' : 'Outfit saved!';
        handleSuccess(message);
      } else {
        // Even if the response indicates failure, check if it actually succeeded
        console.log('Upload response indicated failure, verifying...')
        await verifyUploadSuccess()
      }
    } catch (error) {
      console.error('Error saving outfit:', error)
      
      // If it's a timeout error or network error, check if the upload actually succeeded
      if (error?.code === 'ECONNABORTED' || 
          error?.message?.includes('timeout') || 
          error?.message?.includes('Network Error') ||
          error?.name === 'AxiosError') {
        console.log('Upload timed out or had network issues, checking if it actually succeeded...')
        
        // Wait a moment for the server to process, then verify
        setTimeout(() => {
          verifyUploadSuccess()
        }, 3000) // Wait 3 seconds then check
      } else {
        alert('Error saving outfit. Please check your connection and try again.')
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const handleDeleteOutfit = (outfit: Outfit) => {
    setOutfitToDelete(outfit)
    setShowDeleteOutfitModal(true)
  }

  const confirmDeleteOutfit = async () => {
    if (!outfitToDelete) return

    const success = await deleteOutfit(outfitToDelete.id)

    if (success) {
      setShowDeleteOutfitModal(false)
      closeOutfitModal()
    } else {
      alert('Failed to delete outfit. Please try again.')
    }
  }

  const resetOutfitForm = () => {
    setIsEditing(false)
    setEditingOutfitId(null)
    setSelectedImage(null)
    setUploadProgress(0)
    setOutfitData({
      title: '',
      description: '',
      category: 'Casual',
      tags: '',
      occasion: ''
    })
  }

  const formatTimePosted = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

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
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal || showAddTabModal || showCreateOutfitModal || showOutfitModal || showDeleteModal || showDeleteOutfitModal || showCamera || successMessage ? 'blur-sm' : ''}`}>
        
        
        <Sidebar 
          user={user} 
          onShowSettings={() => setShowSettingsModal(true)}
        />

        {/* Main Content */}
        <div className="flex-1 ml-20">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center">
              <h1 style={{ 
                fontFamily: 'Playfair Display, serif',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                fontSize: '2.25rem',
                fontWeight: 'bold',
                color: '#0B2C21',
                letterSpacing: '0.025em'
              }}>
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  O
                  <img
                    src="/hanger-logo-new.png"
                    alt="Hanger"
                    style={{
                      position: 'absolute',
                      width: '36px',
                      height: '36px',
                      top: '55%',
                      left: '43%',
                      transform: 'translateX(-50%) rotate(12deg)'
                    }}
                  />
                </span>
                utfit Of The Day
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your outfits"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400 shadow-md text-sm w-80"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              <button 
                onClick={handleLogTodaysLook}
                disabled={isUploading}
                className={`px-6 py-3 rounded-full flex items-center space-x-2 shadow-md transition-all ${
                  isUploading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-[#0B2C21] text-white hover:opacity-90'
                }`}
                style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isUploading ? 'Uploading...' : 'Log Today\'s Look'}
                </span>
              </button>
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="flex flex-wrap gap-3 mb-6">
                {tabs.map((tab) => {
                    const isSpecialTab = tab === 'All Outfits' || tab === 'Favorites' || tab === '+ Add Tab'
                    const isSelected = activeTab === tab
                    
                    let tabClasses = `flex items-center space-x-1 px-4 py-3 rounded-lg text-sm font-medium transition-all group `

                    if (isSelected) {
                        tabClasses += isSpecialTab 
                            ? 'bg-[#0B2C21] text-white shadow-inner transform translate-y-1' 
                            : 'bg-transparent text-[#0B2C21] shadow-inner shadow-gray-900/30 transform translate-y-1'
                    } else {
                        tabClasses += 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }

                    return (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                if (!isSpecialTab) {
                                    handleDeleteTab(tab)
                                }
                            }}
                            className={tabClasses}
                            style={{ fontFamily: 'Playfair Display, serif' }}
                            title={!isSpecialTab ? 'Right-click to delete' : ''}
                        >
                            <span>{tab === 'Favorites' ? 'Favorites ❤️' : tab}</span>
                            {!isSpecialTab && (
                                <span 
                                    className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteTab(tab)
                                    }}
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
            <div className="border-b border-gray-200 mb-6"></div>
          </div>

          <div className="px-6 pb-6">
            <OutfitGrid
              outfits={filteredOutfits}
              isLoading={isLoadingOutfits}
              onOutfitClick={handleOutfitClick}
              onLike={handleLike}
              onEdit={handleEditOutfit}
              onDelete={handleDeleteOutfit}
              onCreateFirst={handleLogTodaysLook}
              formatTimePosted={formatTimePosted}
            />
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        currentUser={user}
        onUserUpdate={updateUserData}
        isOfflineMode={false}
      />

      {showOutfitModal && selectedOutfit && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex">
            <div className="flex-1 relative">
              <img
                src={selectedOutfit.image}
                alt={selectedOutfit.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={closeOutfitModal}
                className="absolute top-4 left-4 p-1 bg-[#0B2C21]/70 hover:bg-[#0B2C21]/100 text-white rounded-full transition-all shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-96 p-8 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {selectedOutfit.title}
                </h2>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(selectedOutfit.id)
                    setSelectedOutfit({...selectedOutfit, liked: !selectedOutfit.liked})
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all ml-3"
                >
                  <Heart className={`w-6 h-6 ${selectedOutfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
                </button>
              </div>

              {selectedOutfit.description && (
                <p className="text-gray-700 leading-relaxed mb-6" style={{ fontFamily: 'Inter' }}>
                  {selectedOutfit.description}
                </p>
              )}

              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-[#0B2C21] text-white rounded-full font-semibold">
                   {selectedOutfit.category}
                </span>
              </div>

              {selectedOutfit.tags && selectedOutfit.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedOutfit.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                        style={{ fontFamily: 'Inter' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500 border-t pt-4" style={{ fontFamily: 'Inter' }}>
                 Posted {formatTimePosted(selectedOutfit.created_at)}
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => handleEditOutfit(selectedOutfit)}
                  className="p-2 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteOutfit(selectedOutfit)}
                  className="p-2 text-sm text-red-600 bg-gray-100 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateOutfitModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isEditing ? 'Edit Outfit' : 'Log Today\'s Look'}
              </h3>
              <button
                onClick={handleCloseCreateModal}
                disabled={isUploading}
                className={`p-2 rounded-full transition-colors ${
                  isUploading 
                    ? 'cursor-not-allowed text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!selectedImage ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Add Outfit Photo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => startCamera('user')}
                      disabled={isUploading}
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
                        isUploading
                          ? 'border-gray-200 cursor-not-allowed'
                          : 'border-gray-300 hover:border-[#0B2C21] hover:bg-gray-50'
                      }`}
                    >
                      <Camera className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Take Photo
                      </span>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
                        isUploading
                          ? 'border-gray-200 cursor-not-allowed'
                          : 'border-gray-300 hover:border-[#0B2C21] hover:bg-gray-50'
                      }`}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Upload Photo
                      </span>
                    </button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <div className="relative flex-shrink-0">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-48 h-64 object-contain rounded-lg shadow-md"
                      />
                      <button
                        onClick={() => setSelectedImage(null)}
                        disabled={isUploading}
                        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                          isUploading
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => startCamera('user')}
                        disabled={isUploading}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          isUploading
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        Take New Photo
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          isUploading
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        Choose Different Photo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={outfitData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        disabled={isUploading}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900 ${
                          isUploading ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="e.g., My favorite work outfit"
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Description (optional)
                      </label>
                      <textarea
                        id="description"
                        value={outfitData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        disabled={isUploading}
                        rows={3}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900 ${
                          isUploading ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="Describe your outfit, materials, or style."
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Category
                      </label>
                      <select
                        id="category"
                        value={outfitData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        disabled={isUploading}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900 ${
                          isUploading ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        style={{ fontFamily: 'Inter' }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Tags (optional)
                      </label>
                      <input
                        type="text"
                        id="tags"
                        value={outfitData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        disabled={isUploading}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900 ${
                          isUploading ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                        placeholder="e.g., blazer, jeans, boots"
                        style={{ fontFamily: 'Inter' }}
                      />
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                        Separate tags with commas
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar for uploads */}
                  {isUploading && uploadProgress > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Uploading...</span>
                        <span className="text-sm text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#0B2C21] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleSaveOrUpdateOutfit}
                      disabled={isUploading || !selectedImage || !outfitData.title}
                      className={`px-6 py-3 rounded-full flex items-center space-x-2 font-medium text-sm transition-all ${
                        isUploading || !selectedImage || !outfitData.title 
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-[#0B2C21] text-white hover:opacity-90'
                      }`}
                      style={{ fontFamily: 'Inter' }}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Uploading... Please wait</span>
                        </>
                      ) : (
                        <span>{isEditing ? 'Update Outfit' : 'Save Outfit'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Outfit Posted! 🎉
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                Your look is now live in your feed!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Overlay - prevents user interaction during upload */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/10 z-40 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B2C21] mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Uploading Your Outfit
              </h3>
              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
                Please don't close this window or navigate away
              </p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#0B2C21] h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={handleTakePhoto}
                className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Take Photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-gray-800 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
      <canvas ref={canvasRef} className="hidden" />

      {/* Delete Tab Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-96 shadow-xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Delete Category
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
              Are you sure you want to delete the "{tabToDelete}" category? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setTabToDelete('')
                }}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTab}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showAddTabModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-96 shadow-xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Create New Category
            </h3>
            <input
              type="text"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="Enter category name (e.g., Formal, Casual, Party)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-700"
              style={{ fontFamily: 'Inter' }}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTab()}
              autoFocus
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTabModal(false)
                  setNewTabName('')
                }}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTab}
                disabled={!newTabName.trim()}
                className="flex-1 px-4 py-2 bg-[#0B2C21] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ fontFamily: 'Inter' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      
      {showDeleteOutfitModal && outfitToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 w-96 shadow-2xl border border-white/30">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Delete Outfit
            </h3>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
              Are you sure you want to delete the <span className="font-bold text-gray-800">"{outfitToDelete.title}"</span> outfit? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDeleteOutfitModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100/80 rounded-lg hover:bg-gray-200/80 transition-colors backdrop-blur-sm"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteOutfit}
                className="flex-1 px-4 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600/90 transition-colors backdrop-blur-sm"
                style={{ fontFamily: 'Inter' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}