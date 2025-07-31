'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, Home, Camera, Bell, Settings, Plus, Shirt, Heart, X, Check, User, Lock, Upload, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/shared/Sidebar'

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

function SettingsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUserUpdate,
  isOfflineMode = false
}: {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  onUserUpdate: (updatedData: Partial<User>) => void
  isOfflineMode?: boolean
}) {
  const [settingsForm, setSettingsForm] = useState({
    username: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && currentUser) {
      setSettingsForm(prev => ({
        ...prev,
        username: currentUser.username || '',
        bio: currentUser.bio || ''
      }))
      setPreviewImage(currentUser.avatar || null)
      setErrors({})
    }
  }, [isOpen, currentUser])

  const handleImageUpload = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Please select an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: 'Image size must be less than 5MB' })
      return
    }

    setIsUploadingImage(true)
    setErrors({})

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/auth/upload-avatar/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onUserUpdate({
          ...currentUser,
          avatar: data.avatar
        })
        setPreviewImage(data.avatar)
      } else {
        setErrors({ avatar: data.error || 'Failed to upload image' })
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setErrors({ avatar: 'Failed to upload image. Please try again.' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      handleImageUpload(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (token) {
        await fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      localStorage.removeItem('username')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('savedOutfits')
      window.location.href = '/login'
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!settingsForm.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (settingsForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (settingsForm.newPassword || settingsForm.currentPassword) {
      if (!settingsForm.currentPassword) {
        newErrors.currentPassword = 'Current password is required'
      }
      if (!settingsForm.newPassword) {
        newErrors.newPassword = 'New password is required'
      } else if (settingsForm.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters'
      }
      if (settingsForm.newPassword !== settingsForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const updateData: any = {}
      
      if (settingsForm.username.trim() !== currentUser?.username) {
        updateData.username = settingsForm.username.trim()
      }
      
      if (settingsForm.bio.trim() !== currentUser?.bio) {
        updateData.bio = settingsForm.bio.trim()
      }

      if (settingsForm.currentPassword && settingsForm.newPassword) {
        updateData.current_password = settingsForm.currentPassword
        updateData.new_password = settingsForm.newPassword
      }

      const response = await fetch('http://localhost:8000/api/auth/update-profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        onUserUpdate({
          username: data.username,
          bio: data.bio,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          avatar: data.avatar || currentUser?.avatar
        })

        if (data.new_token) {
          localStorage.setItem('authToken', data.new_token)
        }
        
        setSettingsForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        
        onClose()
      } else {
        if (data.error) {
          if (data.error.includes('Username already exists')) {
            setErrors({ username: 'Username already exists' })
          } else if (data.error.includes('Current password is incorrect')) {
            setErrors({ currentPassword: 'Current password is incorrect' })
          } else {
            setErrors({ general: data.error })
          }
        }
      }
    } catch (error) {
      console.error('Settings update error:', error)
      if (settingsForm.username.trim()) {
        const updatedData = {
          username: settingsForm.username.trim(),
          bio: settingsForm.bio.trim()
        }
        
        onUserUpdate(updatedData)
        localStorage.setItem('username', updatedData.username)
        localStorage.setItem('userBio', updatedData.bio)
        
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg p-6 w-80 shadow-2xl pointer-events-auto border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-bold text-[#0B2C21]" 
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Settings
          </h2>
          <X 
            className="w-5 h-5 text-[#0B2C21] cursor-pointer hover:opacity-70" 
            onClick={onClose}
          />
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <div className="relative w-16 h-16 mx-auto mb-2">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-400 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-orange-600"></div>
                </div>
              )}
              
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={isUploadingImage}
                className="absolute inset-0 w-16 h-16 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploadingImage}
              className="text-xs text-[#0B2C21] hover:opacity-70 disabled:opacity-50"
              style={{ fontFamily: 'Inter' }}
            >
              {isUploadingImage ? 'Uploading...' : 'Change Photo'}
            </button>

            {errors.avatar && (
              <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <input
              type="text"
              value={settingsForm.username}
              onChange={(e) => setSettingsForm({...settingsForm, username: e.target.value})}
              placeholder="Username"
              className={`w-full px-3 py-2 bg-gray-50 border-0 rounded text-sm text-black ${
                errors.username ? 'bg-red-50' : ''
              }`}
              style={{ fontFamily: 'Inter', color: '#000000' }}
            />
            {errors.username && (
              <p className="text-xs text-red-600 mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <textarea
              value={settingsForm.bio}
              onChange={(e) => setSettingsForm({...settingsForm, bio: e.target.value})}
              placeholder="Bio..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 border-0 rounded text-sm resize-none text-black"
              style={{ fontFamily: 'Inter', color: '#000000' }}
            />
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="password"
              value={settingsForm.currentPassword}
              onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
              placeholder="Current password"
              className={`w-full px-3 py-2 bg-gray-50 border-0 rounded text-sm text-black ${
                errors.currentPassword ? 'bg-red-50' : ''
              }`}
              style={{ fontFamily: 'Inter', color: '#000000' }}
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-600">{errors.currentPassword}</p>
            )}

            <input
              type="password"
              value={settingsForm.newPassword}
              onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
              placeholder="New password"
              className={`w-full px-3 py-2 bg-gray-50 border-0 rounded text-sm text-black ${
                errors.newPassword ? 'bg-red-50' : ''
              }`}
              style={{ fontFamily: 'Inter', color: '#000000' }}
            />
            {errors.newPassword && (
              <p className="text-xs text-red-600">{errors.newPassword}</p>
            )}

            <input
              type="password"
              value={settingsForm.confirmPassword}
              onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
              placeholder="Confirm password"
              className={`w-full px-3 py-2 bg-gray-50 border-0 rounded text-sm text-black ${
                errors.confirmPassword ? 'bg-red-50' : ''
              }`}
              style={{ fontFamily: 'Inter', color: '#000000' }}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="w-full py-2.5 bg-[#0B2C21] text-white text-sm rounded hover:opacity-90 disabled:opacity-50"
              style={{ fontFamily: 'Inter' }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading || isUploadingImage}
              className="w-full py-2.5 bg-red-600 text-white text-sm rounded hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
              style={{ fontFamily: 'Inter' }}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OutfitCreator({ isOpen, onClose, onSaveOutfit }: {
  isOpen: boolean
  onClose: () => void
  onSaveOutfit: (outfit: Outfit) => void
}) {
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([])
  const [outfitTitle, setOutfitTitle] = useState('')
  const [outfitDescription, setOutfitDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const filters = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

  useEffect(() => {
    if (isOpen) {
      fetchClothingItems()
    }
  }, [isOpen])

  const fetchClothingItems = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingItems(false)
      return
    }

    try {
      setIsLoadingItems(true)
      const response = await fetch('http://localhost:8000/api/auth/clothing-items/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const itemsData = await response.json()
        const transformedItems = itemsData.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          brand: item.brand || 'Unknown',
          size: item.size || 'Unknown',
          color: item.color || 'Unknown',
          category: item.category || 'Other',
          image: item.image || '',
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          isWorn: item.is_worn || false,
          lastWorn: item.last_worn,
          createdAt: item.created_at
        }))
        setClosetItems(transformedItems)
      }
    } catch (error) {
      console.error('Error fetching clothing items:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }

  const filteredItems = closetItems.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  const handleToggleItem = (item: ClothingItem) => {
    const exists = selectedItems.find(i => i.id === item.id)
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (draggedItem) {
      const exists = selectedItems.find(i => i.id === draggedItem.id)
      if (!exists) {
        setSelectedItems([...selectedItems, draggedItem])
      }
      setDraggedItem(null)
    }
  }

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId))
  }

  const handleSaveOutfit = async () => {
    if (!outfitTitle.trim() || selectedItems.length === 0) {
      alert('Please add a title and select at least one item')
      return
    }

    setIsSaving(true)

    const newOutfit: Outfit = {
      id: Date.now().toString(),
      title: outfitTitle.trim(),
      description: outfitDescription.trim(),
      items: selectedItems,
      thumbnail: selectedItems[0].image,
      createdAt: new Date().toISOString()
    }

    try {
      onSaveOutfit(newOutfit)
      
      setOutfitTitle('')
      setOutfitDescription('')
      setSelectedItems([])
      onClose()
    } catch (error) {
      console.error('Error saving outfit:', error)
      alert('Failed to save outfit. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setOutfitTitle('')
    setOutfitDescription('')
    setSelectedItems([])
    setSearchQuery('')
    setActiveFilter('All')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Create New Outfit
            </h2>
          </div>
          <button
            onClick={handleSaveOutfit}
            disabled={isSaving || !outfitTitle.trim() || selectedItems.length === 0}
            className={`px-6 py-2 rounded-full flex items-center space-x-2 font-medium text-sm transition-all ${
              isSaving || !outfitTitle.trim() || selectedItems.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#0B2C21] text-white hover:opacity-90'
            }`}
            style={{ fontFamily: 'Inter' }}
          >
            {isSaving ? 'Saving...' : 'Save Outfit'}
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          <div className="w-1/3 p-6 border-r border-gray-200 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Outfit Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                    Outfit Title *
                  </label>
                  <input
                    type="text"
                    value={outfitTitle}
                    onChange={(e) => setOutfitTitle(e.target.value)}
                    placeholder="e.g., Casual Weekend Look"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={outfitDescription}
                    onChange={(e) => setOutfitDescription(e.target.value)}
                    placeholder="Perfect for..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900 resize-none"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <h4 className="text-md font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter' }}>
                Outfit Board ({selectedItems.length} items)
              </h4>
              
              <div 
                className={`min-h-[400px] border-2 border-dashed rounded-lg p-4 transition-all ${
                  isDragOver 
                    ? 'border-[#0B2C21] bg-[#0B2C21]/5' 
                    : selectedItems.length === 0 
                      ? 'border-gray-300 bg-gray-50' 
                      : 'border-gray-200 bg-white'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-center" style={{ fontFamily: 'Inter', fontSize: '14px' }}>
                      Drag items here to create your outfit
                    </p>
                    <p className="text-center text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter' }}>
                      or click items from your closet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        style={{
                          transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 3)}deg)`,
                        }}
                      >
                        <div className="aspect-square p-2">
                          <div className="w-full h-4/5 bg-gray-100 rounded mb-2">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                                <Shirt className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="h-1/5 flex flex-col justify-center">
                            <p className="text-xs font-medium truncate text-gray-900" style={{ fontFamily: 'Inter' }}>
                              {item.name}
                            </p>
                            <p className="text-xs opacity-75 text-gray-600" style={{ fontFamily: 'Inter' }}>
                              {item.category}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeSelectedItem(item.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search your closet"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-[#0B2C21] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={{ fontFamily: 'Inter' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your closet...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No items found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.find(i => i.id === item.id)
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onClick={() => handleToggleItem(item)}
                        className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:shadow-md select-none ${
                          isSelected ? 'border-[#0B2C21] ring-2 ring-[#0B2C21] ring-opacity-20' : 'border-gray-200'
                        } ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                        onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                      >
                        <div className="aspect-square bg-gray-100">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Shirt className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#0B2C21] text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                          <p className="text-xs font-medium truncate" style={{ fontFamily: 'Inter' }}>
                            {item.name}
                          </p>
                          <p className="text-xs opacity-75" style={{ fontFamily: 'Inter' }}>
                            {item.category}
                          </p>
                        </div>
                        
                        <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                            Drag me!
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
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

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const token = localStorage.getItem('authToken')
      const response = await fetch('http://localhost:8000/api/auth/upload-avatar/', {
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
    } finally {
      setIsUploadingAvatar(false)
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

  const toggleFavorite = (outfitId: string) => {
    setSavedOutfits(prevOutfits => {
      const updatedOutfits = prevOutfits.map(outfit => 
        outfit.id === outfitId 
          ? { ...outfit, isFavorite: !outfit.isFavorite }
          : outfit
      )
      localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits))
      return updatedOutfits
    })
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

    const outfits = localStorage.getItem('savedOutfits')
    if (outfits) {
      try {
        setSavedOutfits(JSON.parse(outfits))
      } catch (e) {
        console.error('Error parsing saved outfits:', e)
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
    localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits))
  }

  const handleDeleteOutfit = (outfitId: string) => {
    const updatedOutfits = savedOutfits.filter(outfit => outfit.id !== outfitId)
    setSavedOutfits(updatedOutfits)
    localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits))
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
      <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showSettingsModal || showOutfitCreator ? 'blur-sm' : ''}`}>
        
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

          <div className="text-center pl-32 pr-12 mb-8">
            <div 
              className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden cursor-pointer group relative"
              onClick={triggerFileSelect}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover transition-all group-hover:brightness-75"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-orange-400 flex items-center justify-center transition-all group-hover:bg-orange-500">
                  <div className="w-16 h-16 rounded-full bg-orange-600"></div>
                </div>
              )}
              
              {isUploadingAvatar ? (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg border-2 border-gray-100">
                <Camera className="w-3 h-3 text-gray-600" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              {user?.username?.toUpperCase() || 'USERNAME'}
            </h1>

            <p className="text-gray-600 mb-6">
              {user?.bio || 'You write your bio here'}
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowOutfitCreator(true)}
                className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
                  Create Outfit
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('outfits')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full flex items-center space-x-2 hover:bg-gray-300 shadow-md"
              >
                <Shirt className="w-4 h-4" />
                <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
                  My Outfits
                </span>
              </button>
            </div>
          </div>

          <div className="pl-32 pr-12">
            {activeTab === 'outfits' && (
              <div className="pb-6">
                {savedOutfits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shirt className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      No outfits yet
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                      Create your first outfit to start building your style collection
                    </p>

                    {isOfflineMode && (
                      <div className="mt-4 text-sm text-blue-600">
                        <p>Working offline - your changes are saved locally</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 justify-items-center">
                    {savedOutfits
                      .filter(outfit => 
                        searchQuery === '' || 
                        outfit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        outfit.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((outfit) => (
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

      {showOutfitModal && selectedOutfitForView && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-white/20">
            
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {selectedOutfitForView.title}
                </h2>
                {selectedOutfitForView.description && (
                  <p className="text-gray-600 mt-1" style={{ fontFamily: 'Inter' }}>
                    {selectedOutfitForView.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseOutfitModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                {selectedOutfitForView.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow max-w-[200px]"
                    style={{
                      transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 4 + 1)}deg)`,
                    }}
                  >
                    <div className="aspect-square">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Shirt className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: 'Inter' }}>
                        {item.name}
                      </p>
                      <p className="text-xs opacity-75" style={{ fontFamily: 'Inter' }}>
                        {item.brand} • {item.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
                  Created on {new Date(selectedOutfitForView.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}