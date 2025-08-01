'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Camera, Upload, X, Check, Save, Shirt, Package, Crown, ShirtIcon, Star, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  username: string
  avatar?: string
}

// Add API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AddItemPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [itemData, setItemData] = useState({
    name: '',
    brand: '',
    size: '',
    color: '',
    category: 'Tops',
    tags: '',
  })
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const categories = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

  useEffect(() => {
    setIsClient(true)
    
    // Load user from cache
    const cached = localStorage.getItem('userProfile')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      } catch (e) {
        console.error('Error parsing cached user data:', e)
      }
    }
  }, [])

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-6 h-6 text-gray-600"
    switch (category) {
      case 'Tops':
        return <Shirt className={iconClass} />
      case 'Bottoms':
        return <Package className={iconClass} />
      case 'Dresses':
        return <Crown className={iconClass} />
      case 'Outerwear':
        return <ShirtIcon className={iconClass} />
      case 'Shoes':
        return <Star className={iconClass} />
      case 'Accessories':
        return <Zap className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please try uploading a photo instead.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setSelectedImage(imageData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setItemData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!selectedImage) {
      alert('Please add a photo of your item')
      return false
    }
    if (!itemData.name.trim()) {
      alert('Please enter an item name')
      return false
    }
    return true
  }

  const handleSaveItem = async () => {
    if (!validateForm()) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please log in to add items')
      router.push('/login')
      return
    }

    setIsUploading(true)

    try {
      // Convert base64 to blob for upload
      const base64Response = await fetch(selectedImage!)
      const blob = await base64Response.blob()
      
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('name', itemData.name)
      formData.append('brand', itemData.brand || 'Unknown')
      formData.append('size', itemData.size || 'Unknown')
      formData.append('color', itemData.color || 'Unknown')
      formData.append('category', itemData.category)
      formData.append('tags', JSON.stringify(itemData.tags ? itemData.tags.split(',').map(tag => tag.trim()) : []))
      formData.append('is_favorite', 'false')
      formData.append('times_worn', '0')
      formData.append('image', blob, 'clothing-item.jpg')

      // FIXED: Use environment variable instead of hardcoded localhost
      const response = await fetch(`${API_URL}/api/auth/clothing-items/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData
      })

      if (response.ok) {
        setShowSuccessMessage(true)
        console.log('✅ Item added successfully!')
        
        // Reset form
        setSelectedImage(null)
        setItemData({
          name: '',
          brand: '',
          size: '',
          color: '',
          category: 'Tops',
          tags: '',
        })
        
        // Hide success message and redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessMessage(false)
          router.push('/closet')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to add item:', errorData)
        alert('Failed to add item. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error adding item:', error)
      alert('Error adding item. Please check your connection and try again.')
    } finally {
      setIsUploading(false)
    }
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
    <div className="min-h-screen bg-[#F5F3EC]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Add New Item
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {selectedImage && (
              <button
                onClick={handleSaveItem}
                disabled={isUploading}
                className={`px-6 py-3 rounded-full flex items-center space-x-2 font-medium text-sm transition-all ${
                  isUploading 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#0B2C21] text-white hover:opacity-90'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                <Save className="w-4 h-4" />
                <span>{isUploading ? 'Saving...' : 'Save Item'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Photo Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Add Photo
          </h2>
          
          {!selectedImage ? (
            <div className="space-y-4">
              {/* Camera/Upload Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Inter' }}>
                    Take Photo
                  </span>
                  <span className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                    Use camera
                  </span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-gray-600 font-medium" style={{ fontFamily: 'Inter' }}>
                    Upload Photo
                  </span>
                  <span className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                    From gallery
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
            <div className="space-y-4">
              {/* Selected Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected item"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Inter' }}
                >
                  Take New Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Inter' }}
                >
                  Choose Different Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Item Details Form */}
        {selectedImage && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Item Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Blue Denim Jacket"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={itemData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Levi's, Zara, H&M"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Size
                </label>
                <input
                  type="text"
                  value={itemData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="e.g., M, Large, 32, 8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Color
                </label>
                <input
                  type="text"
                  value={itemData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Navy Blue, Black, Red"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleInputChange('category', category)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                        itemData.category === category
                          ? 'border-[#0B2C21] bg-[#0B2C21] text-white'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                      style={{ fontFamily: 'Inter' }}
                    >
                      {getCategoryIcon(category)}
                      <span className="text-xs">{category}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Tags
                </label>
                <input
                  type="text"
                  value={itemData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="e.g., casual, work, summer (comma separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
                <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                  Separate tags with commas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
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
                onClick={takePhoto}
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Item Added Successfully!
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
              Redirecting to your closet...
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}