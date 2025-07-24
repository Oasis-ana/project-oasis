'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Home, Camera, Bell, Settings, Plus, Upload, X, Heart, Trash2, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOutfits } from '../hooks/useOutfits'
import { useCamera } from '../hooks/useCamera'
import SettingsModal from '../profile/SettingsModal'
import { CameraModal, SuccessModal } from '../components/shared'
import OutfitGrid from '../home/components/OutfitGrid'
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
  
  // Camera and outfit creation states
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // Pinterest-style modal states
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null)
  const [showOutfitModal, setShowOutfitModal] = useState(false)
  
  // State for editing outfits
  const [isEditing, setIsEditing] = useState(false)
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null)
  
  // State for deleting outfits
  const [showDeleteOutfitModal, setShowDeleteOutfitModal] = useState(false)
  const [outfitToDelete, setOutfitToDelete] = useState<Outfit | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { outfits, isLoadingOutfits, fetchOutfits, handleLike, addOutfit, updateOutfit, deleteOutfit } = useOutfits()
  const { showCamera, videoRef, canvasRef, startCamera, stopCamera, takePhoto } = useCamera()

  // Base categories
  const baseCategories = ['Casual', 'Work', 'Date Night', 'Formal', 'Party', 'Weekend', 'Travel', 'Sport']
  
  // Combined list of all categories, including custom tabs
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

    try {
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

  // Tab and search management
  const tabs = ['All Outfits', ...defaultTabs, ...customTabs, '+ Add Tab']
  
  // First, filter by the active tab
  const tabFilteredOutfits = activeTab === 'All Outfits' 
    ? outfits 
    : outfits.filter(outfit => outfit.category === activeTab);

  // Then, filter the results by the search query
  const filteredOutfits = tabFilteredOutfits.filter(outfit => {
    if (searchQuery === '') {
      return true; // Return all tab-filtered outfits if no search query
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
    
    if (['All Outfits', ...defaultTabs, ...customTabs].includes(tabName)) {
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
    if (tabToDelete === 'All Outfits') return
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

  const handleSaveOrUpdateOutfit = async () => {
    if (!validateForm()) return

    setIsUploading(true)
    
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
      if (isEditing && editingOutfitId) {
        const updated = await updateOutfit(editingOutfitId, formData)
        success = !!updated
      } else {
        const added = await addOutfit(formData)
        success = !!added
      }
      
      if (success) {
        setShowSuccessMessage(true)
        setTimeout(() => {
          resetOutfitForm()
          setShowSuccessMessage(false)
        }, 2000)
      } else {
        alert('Failed to save outfit. Please try again.')
      }
    } catch (error) {
      console.error('Error saving outfit:', error)
      alert('Error saving outfit. Please check your connection and try again.')
    } finally {
      setIsUploading(false)
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
    setOutfitData({
      title: '',
      description: '',
      category: 'Casual',
      tags: '',
      occasion: ''
    })
    setShowCreateOutfitModal(false)
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
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal || showAddTabModal || showCreateOutfitModal || showOutfitModal || showDeleteModal || showDeleteOutfitModal || showCamera ? 'blur-sm' : ''}`}>
        {/* Left Sidebar */}
        <div className="w-20 bg-[#0B2C21] flex flex-col items-center py-8">
          <div 
            className="w-12 h-12 rounded-full mb-12 overflow-hidden cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-orange-600"></div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center justify-center mb-14">
              <Home className="w-6 h-6 text-white cursor-pointer fill-current" />
            </div>
            
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
            
            <div 
              className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14"
              onClick={handleLogTodaysLook}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
            
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

        {/* Main Content */}
        <div className="flex-1">
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
                </span>utfit Of The Day
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your outfits"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400 shadow-md text-sm"
                  style={{ width: '320px' }}
                />
              </div>

              <button 
                onClick={handleLogTodaysLook}
                className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
                  Log Today's Look
                </span>
              </button>
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="flex space-x-3 mb-6">
                {tabs.map((tab) => {
                    const isSpecialTab = tab === 'All Outfits' || tab === '+ Add Tab'
                    const isSelected = activeTab === tab
                    
                    let tabClasses = `flex items-center space-x-1 px-4 py-3 rounded-lg text-sm font-medium transition-all group `

                    if (isSelected) {
                        // Style for the selected tab
                        tabClasses += isSpecialTab 
                            ? 'bg-[#0B2C21] text-white shadow-inner transform translate-y-1' 
                            : 'bg-transparent text-[#0B2C21] shadow-inner shadow-gray-900/30 transform translate-y-1'
                    } else {
                        // Style for all non-selected tabs
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
                            <span>{tab}</span>
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
                  📂 {selectedOutfit.category}
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
                📅 Posted {formatTimePosted(selectedOutfit.created_at)}
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
              <h3 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                {isEditing ? 'Edit Outfit' : 'Log Today\'s Look'}
              </h3>
              <button
                onClick={resetOutfitForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {!selectedImage ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                    Add Outfit Photo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => startCamera('user')}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                    >
                      <Camera className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Take Photo
                      </span>
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
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
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => startCamera('user')}
                        className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        Take New Photo
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        style={{ fontFamily: 'Playfair Display, serif' }}
                      >
                        Choose Different Photo
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={outfitData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                        placeholder="e.g., My favorite work outfit"
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                        Description (optional)
                      </label>
                      <textarea
                        id="description"
                        value={outfitData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                        placeholder="Describe your outfit, materials, or style."
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                        Category
                      </label>
                      <select
                        id="category"
                        value={outfitData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900"
                        style={{ fontFamily: 'Inter' }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                        Tags (optional)
                      </label>
                      <input
                        type="text"
                        id="tags"
                        value={outfitData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                        placeholder="e.g., blazer, jeans, boots"
                        style={{ fontFamily: 'Inter' }}
                      />
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Separate tags with commas.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="occasion" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                        Occasion (optional)
                      </label>
                      <input
                        type="text"
                        id="occasion"
                        value={outfitData.occasion}
                        onChange={(e) => handleInputChange('occasion', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                        placeholder="e.g., Birthday dinner"
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={resetOutfitForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrUpdateOutfit}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0B2C21] rounded-lg hover:opacity-90 transition-opacity"
                style={{ fontFamily: 'Playfair Display, serif' }}
                disabled={isUploading || !selectedImage}
              >
                {isUploading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Outfit' : 'Save Outfit')}
              </button>
            </div>
          </div>
        </div>
      )}

      <CameraModal 
        isOpen={showCamera} 
        videoRef={videoRef} 
        onTakePhoto={handleTakePhoto} 
        onClose={stopCamera} 
      />
      
      {showSuccessMessage && (
        <SuccessModal
          isOpen={true}
          title="Outfit Saved!"
          message="Your new outfit has been added to your collection."
          onClose={() => setShowSuccessMessage(false)}
        />
      )}
      
      {showAddTabModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
            <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
              Add New Tab
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Give your new outfit category a name.
            </p>
            <input
              type="text"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B2C21]"
              placeholder="e.g., Summer"
              style={{ fontFamily: 'Inter' }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddTabModal(false)
                  setNewTabName('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTab}
                className="px-4 py-2 text-sm font-medium text-white bg-[#0B2C21] rounded-lg hover:opacity-90"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
            <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
              Delete Tab
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Are you sure you want to delete the **{tabToDelete}** tab? This will not delete your outfits, but they will no longer be categorized under this tab.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setTabToDelete('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTab}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showDeleteOutfitModal && outfitToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
            <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Are you sure you want to delete **{outfitToDelete.title}**? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteOutfitModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteOutfit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                style={{ fontFamily: 'Playfair Display, serif' }}
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