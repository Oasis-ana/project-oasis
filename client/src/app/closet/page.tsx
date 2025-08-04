'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Home, Camera, Bell, Settings, Plus, Check, X, Trash2, Shirt, Package, Crown, ShirtIcon, Star, Zap, Link, Edit, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ItemDetailsModal from './components/ItemDetailsModal'
import CameraModal from '../components/shared/CameraModal'
import Sidebar from '../components/shared/Sidebar';

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

interface User {
  username: string
  avatar?: string
}

export default function ClosetPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('My Items')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null)
  
  // Add/Edit Item States (inspired by HomePage)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [itemData, setItemData] = useState({
    name: '',
    brand: '',
    size: '',
    color: '',
    category: 'Tops',
    tags: '',
  })
  
  const [showCameraModal, setShowCameraModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<ClothingItem | null>(null)
  
  // States for Browse Catalog
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null)
  const [urlReference, setUrlReference] = useState('')
  const [catalogItemData, setCatalogItemData] = useState({ brand: '', size: '', color: '', tags: '' })
  
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({})

  // Success message display function (from HomePage)
  const handleSuccess = (message: string) => {
    setShowAddItemModal(false);
    setSuccessMessage(message);
    resetForm();
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  }

  // Router and other hooks
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    const cached = localStorage.getItem('userProfile')
    if (cached) {
      try { setUser(JSON.parse(cached)) } catch (e) { console.error('Error parsing cached user data:', e) }
    }
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchClothingItems()
    }
  }, [isClient])

  const fetchClothingItems = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsLoadingItems(false)
      return
    }
    setIsLoadingItems(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
        headers: { 'Authorization': `Token ${token}` }
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
          image: item.image || item.image_url || '',
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          isWorn: item.is_worn || false,
          lastWorn: item.last_worn,
          createdAt: item.created_at
        }))
        setClothingItems(transformedItems)
      } else {
        console.error('Failed to fetch clothing items')
      }
    } catch (error) {
      console.error('Error fetching clothing items:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }
  
  const resetForm = () => {
    setIsEditing(false)
    setEditingItemId(null)
    setSelectedImage(null)
    setUploadProgress(0)
    setItemData({
      name: '', brand: '', size: '', color: '', category: 'Tops', tags: '',
    })
    setShowAddItemModal(false)
  }
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
    if (event.target) {
      event.target.value = ''
    }
  }

  const handlePhotoTaken = (imageData: string) => {
    setSelectedImage(imageData)
    setShowCameraModal(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setItemData(prev => ({ ...prev, [field]: value }))
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
    if (!validateForm() || isUploading) return

    setIsUploading(true)
    setUploadProgress(25)

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please log in to add items')
      setIsUploading(false)
      return
    }

    const formData = new FormData()
    formData.append('name', itemData.name)
    formData.append('brand', itemData.brand || 'Unknown')
    formData.append('size', itemData.size || 'Unknown')
    formData.append('color', itemData.color || 'Unknown')
    formData.append('category', itemData.category)
    const tagsArray = itemData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    formData.append('tags', JSON.stringify(tagsArray))
    
    if (selectedImage && selectedImage.startsWith('data:')) {
      const base64Response = await fetch(selectedImage)
      const blob = await base64Response.blob()
      formData.append('image', blob, 'clothing-item.jpg')
    }
    setUploadProgress(50)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: formData
      })
      
      setUploadProgress(75)

      if (response.ok) {
        const newItemData = await response.json()
        const newItem: ClothingItem = {
          id: newItemData.id.toString(),
          name: newItemData.name,
          brand: newItemData.brand,
          size: newItemData.size,
          color: newItemData.color,
          category: newItemData.category,
          image: newItemData.image || '',
          tags: newItemData.tags || [],
          isFavorite: newItemData.is_favorite || false,
          isWorn: newItemData.is_worn || false,
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }
        setClothingItems(prev => [newItem, ...prev])
        setUploadProgress(100)
        handleSuccess("Item Added! 🎉")
      } else {
        const errorText = await response.text()
        console.error('Failed to add item - Response not OK:', errorText)
        alert('Failed to add item. Please try again.')
        setIsUploading(false)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item. Please check your connection and try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }
  
  // (You would add the other functions like handleDeleteItem, handleToggleFavorite, etc. here)
  // ...
  
  const tabs = ['My Items', 'Browse Catalog']
  const filters = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Never Worn', 'Favorites', 'Recently Added']

  const filteredItems = clothingItems.filter(item => {
    const matchesFilter =
      activeFilter === 'All' ||
      item.category === activeFilter ||
      (activeFilter === 'Never Worn' && !item.isWorn) ||
      (activeFilter === 'Favorites' && item.isFavorite) ||
      (activeFilter === 'Recently Added' && true)

    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesFilter && matchesSearch
  })
  
  // Placeholder functions for brevity
  const getCategoryIcon = (category: string) => <Shirt className="w-16 h-16 text-gray-300" />
  const getCategoryLabel = (category: string) => category.toUpperCase()
  const confirmDeleteItem = async () => {}
  const handleToggleFavorite = async (item: ClothingItem) => {}
  const handleToggleWear = async (item: ClothingItem) => {}
  const handleUpdateItem = async (updatedItem: ClothingItem) => {}
  const handleDeleteItem = (item: ClothingItem) => {}
  const handleAddCatalogItem = async (item: any) => {}
  const handleAddWithUrl = (item: any) => {}
  const getCatalogItems = () => []
  const getCatalogFilteredItems = () => []
  
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        <div className="w-20 bg-[#0B2C21]"></div>
        <div className="flex-1 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#F5F3EC] border-t-[#0B2C21] rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#F5F3EC] flex transition-all duration-200 ${showAddItemModal || showCameraModal || successMessage ? 'blur-sm' : ''}`}>
      <Sidebar 
        user={user} 
        onShowSettings={() => {}}
      />

      <div className="flex-1 ml-20">
        <div className="flex items-center justify-between p-6">
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.25rem', fontWeight: 'bold', color: '#0B2C21' }}>My Closet</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder="Search your closet" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border-2 border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400 shadow-md text-sm w-80"/>
            </div>
            <button onClick={() => setShowAddItemModal(true)} className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 shadow-md">
              <Plus className="w-4 h-4" /><span>Add Items</span>
            </button>
          </div>
        </div>

        {/* ... Rest of your UI for displaying tabs, filters, and items ... */}
        {/* For brevity, this part is omitted but would be the same as your original file */}
        <div className="px-6 pt-4">
            {/* The tabs and filters UI would go here */}
        </div>
        <div className="px-6 pb-6">
            <div className="grid grid-cols-4 gap-4">
                {/* The filteredItems.map(...) would go here */}
            </div>
        </div>
      </div>
      
      {/* --- ADD ITEM MODAL (now part of this component) --- */}
      {showAddItemModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
                {isEditing ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={resetForm} disabled={isUploading} className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:cursor-not-allowed">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {!selectedImage ? (
                <div>
                  <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Add Item Photo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowCameraModal(true)} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Camera className="w-12 h-12 text-gray-400 mb-3" /><span className="text-sm font-medium text-gray-600">Take Photo</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" /><span className="text-sm font-medium text-gray-600">Upload Photo</span>
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <div className="relative flex-shrink-0">
                      <img src={selectedImage} alt="Selected" className="w-48 h-64 object-contain rounded-lg shadow-md" />
                      <button onClick={() => setSelectedImage(null)} disabled={isUploading} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:bg-gray-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Form fields */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[#0B2C21] mb-2">Item Name</label>
                        <input type="text" id="name" value={itemData.name} onChange={(e) => handleInputChange('name', e.target.value)} disabled={isUploading} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] disabled:bg-gray-100" placeholder="e.g., White Button-Down Shirt" />
                      </div>
                      <div>
                        <label htmlFor="brand" className="block text-sm font-medium text-[#0B2C21] mb-2">Brand</label>
                        <input type="text" id="brand" value={itemData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} disabled={isUploading} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] disabled:bg-gray-100" placeholder="e.g., J.Crew" />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-[#0B2C21] mb-2">Category</label>
                        <select id="category" value={itemData.category} onChange={(e) => handleInputChange('category', e.target.value)} disabled={isUploading} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] disabled:bg-gray-100">
                           <option>Tops</option><option>Bottoms</option><option>Dresses</option><option>Outerwear</option><option>Shoes</option><option>Accessories</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#0B2C21] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                  <div className="flex justify-end mt-8">
                    <button onClick={handleSaveItem} disabled={isUploading || !selectedImage || !itemData.name} className="px-6 py-3 rounded-full flex items-center space-x-2 font-medium text-sm transition-all bg-[#0B2C21] text-white hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isUploading ? 'Adding...' : 'Add Item'}
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
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{successMessage}</h3>
              <p className="text-gray-600">Your item is now in your closet!</p>
            </div>
          </div>
        </div>
      )}
      
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoTaken={handlePhotoTaken}
      />
    </div>
  )
}