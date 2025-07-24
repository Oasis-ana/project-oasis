'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Camera, Upload, X, Check, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  username: string
  avatar?: string
}

export default function CreateOutfitPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [outfitData, setOutfitData] = useState({
    title: '',
    description: '',
    category: 'Casual',
    tags: '',
    occasion: ''
  })
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const categories = ['Casual', 'Work', 'Date Night', 'Formal', 'Party', 'Weekend', 'Travel', 'Sport']

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Use front camera for outfit selfies
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Try back camera if front camera fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setShowCamera(true)
        }
      } catch (backCameraError) {
        console.error('Error accessing back camera:', backCameraError)
        alert('Unable to access camera. Please try uploading a photo instead.')
      }
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for outfits
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

  const handleInputChange = (field: string, value: string) => {
    setOutfitData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const handleSaveOutfit = async () => {
    if (!validateForm()) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please log in to post outfits')
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
      formData.append('title', outfitData.title)
      formData.append('description', outfitData.description || '')
      formData.append('category', outfitData.category)
      formData.append('tags', JSON.stringify(outfitData.tags ? outfitData.tags.split(',').map(tag => tag.trim()) : []))
      formData.append('occasion', outfitData.occasion || '')
      formData.append('image', blob, 'outfit.jpg')

      const response = await fetch('http://localhost:8000/api/outfits/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData
      })

      if (response.ok) {
        setShowSuccessMessage(true)
        console.log('✅ Outfit posted successfully!')
        
        // Reset form
        setSelectedImage(null)
        setOutfitData({
          title: '',
          description: '',
          category: 'Casual',
          tags: '',
          occasion: ''
        })
        
        // Hide success message and redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessMessage(false)
          router.push('/home')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to post outfit:', errorData)
        alert('Failed to post outfit. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error posting outfit:', error)
      alert('Error posting outfit. Please check your connection and try again.')
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
            <div>
              <h1 className="text-2xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Log Today's Look
              </h1>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Inter' }}>
                Share your outfit with the world
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {selectedImage && (
              <button
                onClick={handleSaveOutfit}
                disabled={isUploading}
                className={`px-6 py-3 rounded-full flex items-center space-x-2 font-medium text-sm transition-all ${
                  isUploading 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#0B2C21] text-white hover:opacity-90'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                <Save className="w-4 h-4" />
                <span>{isUploading ? 'Posting...' : 'Post Outfit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Photo Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Add Outfit Photo
          </h2>
          
          {!selectedImage ? (
            <div className="space-y-6">
              {/* Camera/Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-16 h-16 text-gray-400 mb-4" />
                  <span className="text-lg font-medium text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
                    Take Outfit Photo
                  </span>
                  <span className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Inter' }}>
                    Perfect for capturing your OOTD
                  </span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <span className="text-lg font-medium text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
                    Upload Photo
                  </span>
                  <span className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Inter' }}>
                    Choose from your gallery
                  </span>
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
                  💡 <strong>Tip:</strong> Good lighting and a clean background make your outfits shine!
                </p>
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
              <div className="relative max-w-md mx-auto">
                <img
                  src={selectedImage}
                  alt="Selected outfit"
                  className="w-full rounded-lg shadow-md"
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

        {/* Outfit Details Form */}
        {selectedImage && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Outfit Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outfit Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Outfit Title *
                </label>
                <input
                  type="text"
                  value={outfitData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Cozy Weekend Vibes, Office Chic, Date Night Ready"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Description
                </label>
                <textarea
                  value={outfitData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell us about your outfit! What inspired this look?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] resize-none"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Category
                </label>
                <select
                  value={outfitData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Occasion
                </label>
                <input
                  type="text"
                  value={outfitData.occasion}
                  onChange={(e) => handleInputChange('occasion', e.target.value)}
                  placeholder="e.g., Brunch, Meeting, Concert"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>
                  Tags
                </label>
                <input
                  type="text"
                  value={outfitData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="e.g., comfy, trendy, minimalist, colorful (comma separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                  style={{ fontFamily: 'Inter' }}
                />
                <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                  Separate tags with commas to help others discover your style
                </p>
              </div>
            </div>

            {/* Mobile-friendly Save Button */}
            <div className="mt-6 flex justify-end md:hidden">
              <button
                onClick={handleSaveOutfit}
                disabled={isUploading}
                className={`w-full px-6 py-3 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all ${
                  isUploading 
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#0B2C21] text-white hover:opacity-90'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                <Save className="w-4 h-4" />
                <span>{isUploading ? 'Posting...' : 'Post Outfit'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md">
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
                📸 Capture Look
              </button>
              <button
                onClick={stopCamera}
                className="bg-gray-800 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
            </div>
            
            {/* Camera tips */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
              <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
                💡 Stand in good light for the best shot!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 text-center max-w-sm mx-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Outfit Posted! 🎉
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
              Your look is now live. Returning to feed...
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}