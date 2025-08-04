'use client' 

import { Home, Camera, Bell, Settings, X, Upload, Sun, Moon, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, LoaderCircle, CloudDrizzle, Wind } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef } from 'react'
import CameraModal from './CameraModal'
import { useWeather } from '../../hooks/useWeather'     // CORRECTED PATH
import WeatherModal from './WeatherModal'         // Assuming this path is correct

interface SidebarProps {
  user?: { avatar?: string } | null;
  onShowSettings: () => void;
}

interface OutfitData {
  title: string
  description: string
  category: string
  tags: string
  occasion: string
}

interface ItemData {
  name: string
  brand: string
  size: string
  color: string
  category: string
  tags: string
}

// Updated weather icon function with better condition mapping
const getWeatherIcon = (weather: any) => {
  const iconProps = { className: "w-6 h-6 text-white" };
  
  if (!weather || !weather.weather || weather.weather.length === 0) {
    return <Bell {...iconProps} />;
  }

  const condition = weather.weather[0].main.toLowerCase();
  const description = weather.weather[0].description.toLowerCase();
  const iconCode = weather.weather[0].icon;
  const isDay = iconCode.endsWith('d');

  // Primary condition-based mapping
  switch (condition) {
    case 'clear':
      return isDay ? <Sun {...iconProps} /> : <Moon {...iconProps} />;
    
    case 'rain':
      if (description.includes('light') || description.includes('drizzle')) {
        return <CloudDrizzle {...iconProps} />;
      }
      return <CloudRain {...iconProps} />;
    
    case 'drizzle':
      return <CloudDrizzle {...iconProps} />;
    
    case 'snow':
      return <CloudSnow {...iconProps} />;
    
    case 'thunderstorm':
      return <CloudLightning {...iconProps} />;
    
    case 'clouds':
      if (description.includes('few') || description.includes('scattered')) {
        return <CloudSun {...iconProps} />;
      }
      return <Cloud {...iconProps} />;
    
    case 'mist':
    case 'fog':
    case 'haze':
    case 'smoke':
      return <Cloud {...iconProps} />;
    
    case 'wind':
      return <Wind {...iconProps} />;
    
    default:
      // Fallback to icon code mapping
      switch (iconCode) {
        case '01d': return <Sun {...iconProps} />;
        case '01n': return <Moon {...iconProps} />;
        case '02d': case '02n': return <CloudSun {...iconProps} />;
        case '03d': case '03n': case '04d': case '04n': return <Cloud {...iconProps} />;
        case '09d': case '09n': return <CloudDrizzle {...iconProps} />;
        case '10d': case '10n': return <CloudRain {...iconProps} />;
        case '11d': case '11n': return <CloudLightning {...iconProps} />;
        case '13d': case '13n': return <CloudSnow {...iconProps} />;
        case '50d': case '50n': return <Cloud {...iconProps} />;
        default: return <Bell {...iconProps} />;
      }
  }
};

const Sidebar = ({ user, onShowSettings }: SidebarProps) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const router = useRouter()
  const pathname = usePathname()
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<'outfit' | 'item' | null>(null)
  
  const [showCreateOutfitModal, setShowCreateOutfitModal] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [outfitData, setOutfitData] = useState<OutfitData>({
    title: '',
    description: '',
    category: 'Casual',
    tags: '',
    occasion: ''
  })
  const [itemData, setItemData] = useState<ItemData>({
    name: '',
    brand: '',
    size: '',
    color: '',
    category: 'Tops',
    tags: ''
  })

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const { weather, loading, error } = useWeather();

  const handleWeatherIconClick = () => {
    if (weather) {
      setIsWeatherModalOpen(true);
    } else if (error) {
      alert(`Could not fetch weather: ${error}`);
    }
  };

  // Updated render function to use the new weather icon logic
  const renderWeatherIcon = () => {
    if (loading) {
      return <LoaderCircle className="w-6 h-6 text-white animate-spin" />;
    }
    if (error || !weather) {
      return <Bell className="w-6 h-6 text-white" />;
    }
    return getWeatherIcon(weather);
  };

  const fileInputRef = useRef<HTMLInputElement>(null)

  const baseCategories = ['Casual', 'Work', 'Date Night', 'Formal', 'Party', 'Weekend', 'Travel', 'Sport']

  const handleCameraClick = () => {
    setShowChoiceModal(true)
  }

  const handleChoiceSelection = (choice: 'outfit' | 'item') => {
    setSelectedChoice(choice)
    setShowChoiceModal(false)
    
    if (choice === 'outfit') {
      setShowCreateOutfitModal(true)
    } else if (choice === 'item') {
      setShowAddItemModal(true)
    }
  }

  const handlePhotoTaken = (imageData: string) => {
    setSelectedImage(imageData)
    setShowCameraModal(false)
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

  const handleOutfitInputChange = (field: string, value: string) => {
    setOutfitData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemInputChange = (field: string, value: string) => {
    setItemData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveOutfit = async () => {
    if (!selectedImage || !outfitData.title.trim()) {
      alert('Please add a photo and title for your outfit')
      return
    }

    setIsUploading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please log in to save outfits')
        return
      }

      const formData = new FormData()
      formData.append('title', outfitData.title)
      if (outfitData.description) formData.append('description', outfitData.description)
      formData.append('category', outfitData.category)
      const tagsArray = outfitData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      tagsArray.forEach(tag => formData.append('tags', tag))
      if (outfitData.occasion) formData.append('occasion', outfitData.occasion)
      
      if (selectedImage.startsWith('data:')) {
        const base64Response = await fetch(selectedImage)
        const blob = await base64Response.blob()
        formData.append('image', blob, 'outfit.jpg')
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/outfits/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData
      })

      if (response.ok) {
        alert('Outfit saved successfully! 🎉')
        resetOutfitForm()
      } else {
        alert('Failed to save outfit. Please try again.')
      }
    } catch (error) {
      console.error('Error saving outfit:', error)
      alert('Error saving outfit. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveItem = async () => {
    if (!selectedImage || !itemData.name.trim()) {
      alert('Please add a photo and name for your item')
      return
    }

    setIsUploading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        alert('Please log in to add items')
        return
      }

      const base64Response = await fetch(selectedImage)
      const blob = await base64Response.blob()
      
      const formData = new FormData()
      formData.append('name', itemData.name)
      formData.append('brand', itemData.brand || 'Unknown')
      formData.append('size', itemData.size || 'Unknown')
      formData.append('color', itemData.color || 'Unknown')
      formData.append('category', itemData.category)
      formData.append('tags', JSON.stringify(itemData.tags ? itemData.tags.split(',').map(tag => tag.trim()) : []))
      formData.append('is_favorite', 'false')
      formData.append('is_worn', 'false')
      formData.append('image', blob, 'clothing-item.jpg')

      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData
      })

      if (response.ok) {
        alert('Item added successfully! ✅')
        resetItemForm()
      } else {
        alert('Failed to add item. Please try again.')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetOutfitForm = () => {
    setSelectedImage(null)
    setOutfitData({ title: '', description: '', category: 'Casual', tags: '', occasion: '' })
    setShowCreateOutfitModal(false)
    setSelectedChoice(null)
  }

  const resetItemForm = () => {
    setSelectedImage(null)
    setItemData({ name: '', brand: '', size: '', color: '', category: 'Tops', tags: '' })
    setShowAddItemModal(false)
    setSelectedChoice(null)
  }

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-20 bg-[#0B2C21] flex flex-col items-center py-8 z-10">
        <div className="w-12 h-12 rounded-full mb-12 overflow-hidden cursor-pointer" onClick={() => router.push('/profile')}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-orange-400 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-orange-600"></div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center justify-center mb-14 cursor-pointer hover:opacity-75 transition-opacity" onClick={() => router.push('/home')}>
            <Home className={`w-6 h-6 text-white ${(pathname === '/home' || pathname === '/homepage' || pathname === '/') ? 'fill-current' : ''}`} />
          </div>

          <div className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14 transition-opacity" onClick={() => router.push('/closet')}>
            <img src={pathname === '/closet' ? "/filled-in-hanger.png" : "/hanger-for-sidebar.png?v=2"} alt="Hanger" className="object-contain" style={{ filter: 'brightness(0) invert(1)', width: '32px', height: '32px', opacity: pathname === '/closet' ? 1 : 0.75 }}/>
          </div>

          <div className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14 transition-opacity" onClick={handleCameraClick}>
            <Camera className="w-6 h-6 text-white" />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleWeatherIconClick}
              className="hover:opacity-75 transition-opacity"
              title={weather ? `${weather.weather[0].description} - ${Math.round(weather.main.temp)}°` : error ? `Error: ${error}`: "Fetching Weather..."}
            >
              {renderWeatherIcon()}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Settings className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" onClick={onShowSettings} />
        </div>
      </div>

      <WeatherModal 
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weather}
      />

      {/* --- Rest of your modals --- */}
      {showChoiceModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-96 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
              What would you like to add?
            </h3>
            <p className="text-gray-600 mb-6 text-center text-sm" style={{ fontFamily: 'Inter' }}>
              Choose what you want to create
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleChoiceSelection('outfit')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-[#0B2C21] rounded-full flex items-center justify-center mb-3"><Camera className="w-6 h-6 text-white" /></div>
                <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>Log Today's Look</span>
                <span className="text-xs text-gray-500 mt-1 text-center" style={{ fontFamily: 'Inter' }}>Share your outfit</span>
              </button>
              <button onClick={() => handleChoiceSelection('item')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-3"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></div>
                <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>Add Item</span>
                <span className="text-xs text-gray-500 mt-1 text-center" style={{ fontFamily: 'Inter' }}>Add to closet</span>
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <button onClick={() => setShowChoiceModal(false)} className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'Inter' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCreateOutfitModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>Log Today's Look</h3>
              <button onClick={resetOutfitForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              {!selectedImage ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Add Outfit Photo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowCameraModal(true)} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Camera className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>Take Photo</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>Upload Photo</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <div className="relative flex-shrink-0">
                      <img src={selectedImage} alt="Selected" className="w-48 h-64 object-contain rounded-lg shadow-md" />
                      <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-col space-y-3">
                      <button onClick={() => setShowCameraModal(true)} className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>Take New Photo</button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>Choose Different Photo</button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Title</label>
                      <input type="text" value={outfitData.title} onChange={(e) => handleOutfitInputChange('title', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="e.g., My favorite work outfit" style={{ fontFamily: 'Inter' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Description (optional)</label>
                      <textarea value={outfitData.description} onChange={(e) => handleOutfitInputChange('description', e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="Describe your outfit..." style={{ fontFamily: 'Inter' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Category</label>
                      <select value={outfitData.category} onChange={(e) => handleOutfitInputChange('category', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" style={{ fontFamily: 'Inter' }}>
                        {baseCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Tags (optional)</label>
                      <input type="text" value={outfitData.tags} onChange={(e) => handleOutfitInputChange('tags', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="e.g., blazer, jeans, boots" style={{ fontFamily: 'Inter' }} />
                    </div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <button onClick={handleSaveOutfit} disabled={isUploading || !selectedImage || !outfitData.title} className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${isUploading || !selectedImage || !outfitData.title ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#0B2C21] text-white hover:opacity-90'}`} style={{ fontFamily: 'Inter' }}>
                        {isUploading ? 'Saving...' : 'Save Outfit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>Add Item to Closet</h3>
              <button onClick={resetItemForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              {!selectedImage ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Add Item Photo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowCameraModal(true)} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Camera className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>Take Photo</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>Upload Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <div className="relative flex-shrink-0">
                      <img src={selectedImage} alt="Selected" className="w-48 h-64 object-contain rounded-lg shadow-md" />
                      <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-col space-y-3">
                      <button onClick={() => setShowCameraModal(true)} className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>Take New Photo</button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" style={{ fontFamily: 'Playfair Display, serif' }}>Choose Different Photo</button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Item Name</label>
                      <input type="text" value={itemData.name} onChange={(e) => handleItemInputChange('name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="e.g., Blue denim jacket" style={{ fontFamily: 'Inter' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Color</label>
                        <input type="text" value={itemData.color} onChange={(e) => handleItemInputChange('color', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="e.g., Blue" style={{ fontFamily: 'Inter' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Category</label>
                        <select value={itemData.category} onChange={(e) => handleItemInputChange('category', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" style={{ fontFamily: 'Inter' }}>
                          <option value="Tops">Tops</option>
                          <option value="Bottoms">Bottoms</option>
                          <option value="Dresses">Dresses</option>
                          <option value="Outerwear">Outerwear</option>
                          <option value="Shoes">Shoes</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Tags (optional)</label>
                      <input type="text" value={itemData.tags} onChange={(e) => handleItemInputChange('tags', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900" placeholder="e.g., casual, work, winter" style={{ fontFamily: 'Inter' }} />
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>Separate tags with commas</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <button onClick={handleSaveItem} disabled={isUploading || !selectedImage || !itemData.name} className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${isUploading || !selectedImage || !itemData.name ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#0B2C21] text-white hover:opacity-90'}`} style={{ fontFamily: 'Inter' }}>
                        {isUploading ? 'Saving...' : 'Add to Closet'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoTaken={handlePhotoTaken}
      />
    </>
  )
}

export default Sidebar; 