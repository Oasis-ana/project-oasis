'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Home, Camera, Bell, Settings, Plus, Check, X, Trash2, Shirt, Package, Crown, ShirtIcon, Star, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddItemModal from './components/AddItemModal'
import ItemDetailsModal from './components/ItemDetailsModal'
import CameraModal from '../components/shared/CameraModal'

// UPDATED: The ClothingItem interface now uses `isWorn: boolean`
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
  isWorn: boolean // Changed from timesWorn: number
  lastWorn?: string
  createdAt: string
}

interface User {
  username: string
  avatar?: string
}

export default function ClosetPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [activeTab, setActiveTab] = useState('My Items')
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null)
  
  // State for AddItemModal
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [itemData, setItemData] = useState({
    name: '',
    brand: '',
    size: '',
    color: '',
    category: 'Tops',
    tags: '',
  })

  // State for CameraModal
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for ItemDetailsModal
  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<ClothingItem | null>(null)
  
  const router = useRouter()


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
            isWorn: item.is_worn || false, // UPDATED: Changed from times_worn
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

    if (isClient) {
      fetchClothingItems()
    }
  }, [isClient])

  const tabs = ['My Items', 'Browse Catalog']
  // UPDATED: The 'Never Worn' filter now checks for `!item.isWorn`
  const filters = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Never Worn', 'Favorites', 'Recently Added']

  const totalItems = clothingItems.length
  const recentlyWorn = clothingItems.filter(item => {
    if (!item.lastWorn) return false
    const lastWornDate = new Date(item.lastWorn)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastWornDate > thirtyDaysAgo
  }).length
  const neverWorn = clothingItems.filter(item => !item.isWorn).length // UPDATED: Checks for `!item.isWorn`
  const favorites = clothingItems.filter(item => item.isFavorite).length

  const filteredItems = clothingItems.filter(item => {
    const matchesFilter =
      activeFilter === 'All' ||
      item.category === activeFilter ||
      (activeFilter === 'Never Worn' && !item.isWorn) || // UPDATED: Checks for `!item.isWorn`
      (activeFilter === 'Favorites' && item.isFavorite) ||
      (activeFilter === 'Recently Added' && true)

    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-16 h-16 text-gray-300"
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

  const getCategoryLabel = (category: string) => {
    const labels = {
      Dresses: 'DRESS',
      Bottoms: 'BOTTOMS',
      Tops: 'TOP',
      Outerwear: 'OUTERWEAR',
      Shoes: 'SHOES',
      Accessories: 'ACCESSORY'
    }
    return labels[category as keyof typeof labels] || category.toUpperCase()
  }

  const getCatalogItems = () => [
    { id: 'c1', name: 'White Button-Down Shirt', category: 'Tops', description: 'Classic collared button-up', commonBrands: ['Uniqlo', 'J.Crew'], icon: 'shirt' },
    { id: 'c2', name: 'Black T-Shirt', category: 'Tops', description: 'Basic crew neck tee', commonBrands: ['Hanes', 'Uniqlo'], icon: 'shirt' },
    { id: 'c3', name: 'White T-Shirt', category: 'Tops', description: 'Basic white tee', commonBrands: ['Hanes', 'Uniqlo'], icon: 'shirt' },
    { id: 'c4', name: 'Striped Long-Sleeve', category: 'Tops', description: 'Navy/white stripes', commonBrands: ['J.Crew', 'Madewell'], icon: 'shirt' },
    { id: 'c5', name: 'Cashmere Sweater', category: 'Tops', description: 'Soft pullover sweater', commonBrands: ['Uniqlo', 'Everlane'], icon: 'shirt' },
    { id: 'c6', name: 'Cardigan', category: 'Tops', description: 'Button-up sweater', commonBrands: ['J.Crew', 'Madewell'], icon: 'shirt' },
    { id: 'c7', name: 'Dark Wash Jeans', category: 'Bottoms', description: 'Classic blue denim', commonBrands: ['Levi\'s', 'Madewell'], icon: 'package' },
    { id: 'c8', name: 'Light Wash Jeans', category: 'Bottoms', description: 'Faded blue denim', commonBrands: ['Levi\'s', 'American Eagle'], icon: 'package' },
    { id: 'c9', name: 'Black Pants', category: 'Bottoms', description: 'Dress pants or slacks', commonBrands: ['Banana Republic', 'Ann Taylor'], icon: 'package' },
    { id: 'c10', name: 'Leggings', category: 'Bottoms', description: 'Stretch athletic pants', commonBrands: ['Lululemon', 'Athleta'], icon: 'package' },
    { id: 'c11', name: 'Little Black Dress', category: 'Dresses', description: 'Classic cocktail dress', commonBrands: ['Zara', 'Banana Republic'], icon: 'crown' },
    { id: 'c12', name: 'Wrap Dress', category: 'Dresses', description: 'Flattering wrap-style', commonBrands: ['DVF', 'J.Crew'], icon: 'crown' },
    { id: 'c13', name: 'Maxi Dress', category: 'Dresses', description: 'Long flowing dress', commonBrands: ['Free People', 'Anthropologie'], icon: 'crown' },
    { id: 'c14', name: 'Denim Jacket', category: 'Outerwear', description: 'Classic jean jacket', commonBrands: ['Levi\'s', 'Madewell'], icon: 'shirticon' },
    { id: 'c15', name: 'Black Blazer', category: 'Outerwear', description: 'Professional jacket', commonBrands: ['Zara', 'Banana Republic'], icon: 'shirticon' },
    { id: 'c16', name: 'Leather Jacket', category: 'Outerwear', description: 'Edgy moto jacket', commonBrands: ['AllSaints', 'Madewell'], icon: 'shirticon' },
    { id: 'c17', name: 'White Sneakers', category: 'Shoes', description: 'Classic tennis shoes', commonBrands: ['Adidas', 'Nike'], icon: 'star' },
    { id: 'c18', name: 'Black Heels', category: 'Shoes', description: 'Professional pumps', commonBrands: ['Cole Haan', 'Nine West'], icon: 'star' },
    { id: 'c19', name: 'Ballet Flats', category: 'Shoes', description: 'Comfortable flat shoes', commonBrands: ['Tory Burch', 'Cole Haan'], icon: 'star' },
    { id: 'c20', name: 'Black Belt', category: 'Accessories', description: 'Classic leather belt', commonBrands: ['Coach', 'Kate Spade'], icon: 'zap' },
    { id: 'c21', name: 'Watch', category: 'Accessories', description: 'Classic timepiece', commonBrands: ['Apple', 'Michael Kors'], icon: 'zap' },
    { id: 'c22', name: 'Sunglasses', category: 'Accessories', description: 'UV protection eyewear', commonBrands: ['Ray-Ban', 'Oakley'], icon: 'zap' }
  ]

  const handleAddCatalogItem = async (catalogItem: any) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found')
      return
    }

    setAddedItems(prev => new Set([...prev, catalogItem.id]))

    try {
      const response = await fetch('http://localhost:8000/api/auth/clothing-items/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: catalogItem.name,
          brand: catalogItem.commonBrands[0],
          size: 'M',
          color: 'Various',
          category: catalogItem.category,
          tags: ['wardrobe-essential'],
          is_favorite: false,
          is_worn: false, // UPDATED: Added is_worn
        })
      })

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
          isWorn: newItemData.is_worn || false, // UPDATED: Changed from times_worn
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }

        setClothingItems(prev => [...prev, newItem])
        
        console.log('✅ Item added successfully:', newItem.name)
      } else {
        console.error('❌ Failed to add item to backend')
        setAddedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(catalogItem.id)
          return newSet
        })
      }
    } catch (error) {
      console.error('❌ Error adding catalog item:', error)
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(catalogItem.id)
        return newSet
      })
    }

    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(catalogItem.id)
        return newSet
      })
    }, 3000)
  }

  const handleDeleteItem = (item: ClothingItem) => {
    setItemToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found')
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/auth/clothing-items/${itemToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setClothingItems(prev => prev.filter(item => item.id !== itemToDelete.id))
        console.log('✅ Item deleted successfully:', itemToDelete.name)
      } else {
        console.error('❌ Failed to delete item from backend')
      }
    } catch (error) {
      console.error('❌ Error deleting item:', error)
    }

    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
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
      if (file.size > 5 * 1024 * 1024) {
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
      return
    }

    setIsUploading(true)

    try {
      const base64Response = await fetch(selectedImage!)
      const blob = await base64Response.blob()
      
      const formData = new FormData()
      formData.append('name', itemData.name)
      formData.append('brand', itemData.brand || 'Unknown')
      formData.append('size', itemData.size || 'Unknown')
      formData.append('color', itemData.color || 'Unknown')
      formData.append('category', itemData.category)
      formData.append('tags', JSON.stringify(itemData.tags ? itemData.tags.split(',').map(tag => tag.trim()) : []))
      formData.append('is_favorite', 'false')
      formData.append('is_worn', 'false') // UPDATED: Changed from times_worn
      formData.append('image', blob, 'clothing-item.jpg')

      const response = await fetch('http://localhost:8000/api/auth/clothing-items/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData
      })

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
          isWorn: newItemData.is_worn || false, // UPDATED: Changed from times_worn
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }

        setClothingItems(prev => [...prev, newItem])
        console.log('✅ Item added successfully!')
        
        resetForm()
      } else {
        console.error('❌ Failed to add item')
        alert('Failed to add item. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error adding item:', error)
      alert('Error adding item. Please check your connection and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedImage(null)
    setItemData({
      name: '',
      brand: '',
      size: '',
      color: '',
      category: 'Tops',
      tags: '',
    })
    setShowAddItemModal(false)
    setShowCamera(false)
  }

  const openAddItemModal = () => {
    setShowAddItemModal(true)
  }

  const getCatalogFilteredItems = () => {
    const catalogItems = getCatalogItems()
    if (activeFilter === 'All') return catalogItems
    return catalogItems.filter(item => item.category === activeFilter)
  }

  const handleOpenItemDetails = (item: ClothingItem) => {
    setSelectedItemForDetails(item)
    setShowItemDetailsModal(true)
  }

  const handleCloseItemDetails = () => {
    setShowItemDetailsModal(false)
    setSelectedItemForDetails(null)
  }

  // UPDATED: This function replaces handleLogWear
  const handleToggleWear = async (itemToUpdate: ClothingItem) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please log in to update items.');
      return;
    }

    const newIsWornStatus = !itemToUpdate.isWorn;

    // Optimistically update the UI first
    const updatedItems = clothingItems.map(item =>
      item.id === itemToUpdate.id
        ? { ...item, isWorn: newIsWornStatus, lastWorn: newIsWornStatus ? new Date().toISOString() : item.lastWorn }
        : item
    );
    setClothingItems(updatedItems);
    setSelectedItemForDetails(updatedItems.find(item => item.id === itemToUpdate.id) || null);

    try {
      const response = await fetch(`http://localhost:8000/api/auth/clothing-items/${itemToUpdate.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_worn: newIsWornStatus,
          last_worn: newIsWornStatus ? new Date().toISOString() : itemToUpdate.lastWorn,
        })
      });

      if (!response.ok) {
        setClothingItems(clothingItems);
        setSelectedItemForDetails(itemToUpdate);
        alert('Failed to save wear status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling wear status:', error);
      setClothingItems(clothingItems);
      setSelectedItemForDetails(itemToUpdate);
      alert('Network error. Please check your connection.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        <div className="w-20 bg-[#0B2C21]"></div>
        <div className="flex-1"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EC] flex">
      {/* ... (Sidebar and header remain the same) */}
      <div className="w-20 bg-[#0B2C21] flex flex-col items-center py-8">
        <div 
          className="w-12 h-12 rounded-full mb-12 overflow-hidden cursor-pointer"
          onClick={() => window.location.href = '/profile'}
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
          <div className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14" onClick={() => window.location.href = '/home'}>
            <Home className="w-6 h-6 text-white" />
          </div>

          <div className="flex items-center justify-center cursor-pointer mb-14">
            <img src="/filled-in-hanger.png" alt="Closet - Active" className="object-contain" style={{ width: '32px', height: '32px' }} />
          </div>

          <div className="flex items-center justify-center cursor-pointer hover:opacity-75 mb-14">
            <Camera className="w-6 h-6 text-white" />
          </div>

          <div className="flex items-center justify-center cursor-pointer hover:opacity-75">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex items-center justify-center cursor-pointer hover:opacity-75">
          <Settings className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between p-6">
          <div className="relative">
            <h1
              style={{
                fontFamily: 'Playfair Display, serif',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                fontSize: '2.25rem',
                fontWeight: 'bold',
                color: '#0B2C21',
                letterSpacing: '0.025em',
              }}
            >
              My Closet
            </h1>
            <img
              src="/hanger-logo-new.png"
              alt="Hanger"
              style={{
                position: 'absolute',
                top: '30px',
                left: '92px',
                width: '34px',
                height: '34px',
                transform: 'rotate(10deg)',
                zIndex: 0
              }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your closet"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400 shadow-md text-sm"
                style={{ width: '320px' }}
              />
            </div>

            <button 
              onClick={openAddItemModal}
              className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
                Add Items
              </span>
            </button>
          </div>
        </div>
        {/* ... (Tabs and stats section remain the same) */}
        <div className="px-6 pt-4">
          <div className="inline-flex bg-white p-1 rounded-full shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-[#0B2C21] text-white'
                    : 'text-gray-600'
                }`}
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'My Items' && (
          <>
            <div className="px-6 mt-8 mb-8">
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{totalItems}</div>
                  <div className="text-gray-600" style={{ fontFamily: 'Inter' }}>Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{recentlyWorn}</div>
                  <div className="text-gray-600" style={{ fontFamily: 'Inter' }}>Recently Worn</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{neverWorn}</div>
                  <div className="text-gray-600" style={{ fontFamily: 'Inter' }}>Never Worn</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{favorites}</div>
                  <div className="text-gray-600" style={{ fontFamily: 'Inter' }}>Favorites</div>
                </div>
              </div>
            </div>

            <div className="px-6 mt-4 mb-8">
              <div className="flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
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

            <div className="px-6 pb-6">
              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your closet...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No items found. Start building your closet!</p>
                  <button 
                    onClick={openAddItemModal}
                    className="bg-[#0B2C21] text-white px-6 py-3 rounded-full hover:opacity-90"
                  >
                    Add Your First Item
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                      <div
                        onClick={() => handleOpenItemDetails(item)}
                      >
                        <div className="relative">
                          <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getCategoryIcon(item.category)
                            )}
                          </div>
                          
                          <div className="absolute top-3 left-3 bg-gray-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                            {getCategoryLabel(item.category)}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteItem(item)
                            }}
                            className="absolute top-3 right-3 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Inter' }}>
                            {item.brand} • Size {item.size} • {item.color}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                style={{ fontFamily: 'Inter' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWear(item); // UPDATED: Calls the new function
                          }}
                          className={`w-full py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors
                            ${item.isWorn ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                          `}
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {item.isWorn ? 'Worn' : 'Not Worn'} {/* UPDATED: Displays "Worn" or "Not Worn" */}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ... (Catalog section remains the same) */}
        {activeTab === 'Browse Catalog' && (
          <>
            <div className="px-6 mt-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Browse Wardrobe Essentials
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                Quickly add common items you already own to your closet
              </p>
            </div>

            <div className="px-6 mt-4 mb-8">
              <div className="flex flex-wrap gap-3">
                {['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
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

            <div className="px-6 pb-6">
              <div className="grid grid-cols-3 gap-6">
                {getCatalogFilteredItems().map((item) => {
                  const isAdded = addedItems.has(item.id)
                  return (
                    <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative">
                        <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="absolute top-3 left-3 bg-gray-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                          {getCategoryLabel(item.category)}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Inter' }}>
                          {item.description}
                        </p>
                        
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.commonBrands.slice(0, 2).map((brand, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                style={{ fontFamily: 'Inter' }}
                              >
                                {brand}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddCatalogItem(item)}
                          disabled={isAdded}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2
                            ${isAdded ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-[#0B2C21] text-white hover:opacity-90'}
                          `}
                          style={{ fontFamily: 'Inter' }}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Add to My Closet</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Modal Components - Their visibility is controlled by state */}
      <AddItemModal
        isOpen={showAddItemModal}
        selectedImage={selectedImage}
        itemData={itemData}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onClose={resetForm}
        onInputChange={handleInputChange}
        onTakePhoto={takePhoto}
        onFileUpload={handleFileUpload}
        onSave={handleSaveItem}
        onStartCamera={startCamera}
        onResetSelectedImage={() => setSelectedImage(null)}
      />
      
      <CameraModal 
        isOpen={showCamera} 
        videoRef={videoRef} 
        canvasRef={canvasRef}
        onTakePhoto={takePhoto} 
        onClose={stopCamera} 
      />

      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
            <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Are you sure you want to delete **{itemToDelete.name}**? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ItemDetailsModal
        isOpen={showItemDetailsModal}
        item={selectedItemForDetails}
        onClose={handleCloseItemDetails}
        onToggleWear={handleToggleWear} // UPDATED: New prop name
      />
    </div>
  )
}