'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Lock, Upload, LogOut, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  onUserUpdate: (updatedData: Partial<User>) => void
  isOfflineMode?: boolean
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUserUpdate,
  isOfflineMode = false
}: SettingsModalProps) {
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
  const router = useRouter()

  // Set current user data when modal opens
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
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
        // Update user data with new avatar
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
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload image
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
      router.push('/login')
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!settingsForm.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (settingsForm.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    // Password validation (only if changing password)
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

      // Prepare update data
      const updateData: any = {}
      
      // Only include changed fields
      if (settingsForm.username.trim() !== currentUser?.username) {
        updateData.username = settingsForm.username.trim()
      }
      
      if (settingsForm.bio.trim() !== currentUser?.bio) {
        updateData.bio = settingsForm.bio.trim()
      }

      // Include password fields if changing password
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
        
        {/* Header */}
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

        {/* Error */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Profile Picture with Upload */}
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
              
              {/* Upload overlay */}
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

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Username */}
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

          {/* Bio */}
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

          {/* Passwords */}
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

          {/* Buttons */}
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