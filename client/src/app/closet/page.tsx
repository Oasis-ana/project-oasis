'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Home, Camera, Bell, Settings, Plus, Check, X, Trash2, Shirt, Package, Crown, ShirtIcon, Star, Zap, Link, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddItemModal from './components/AddItemModal'
import ItemDetailsModal from './components/ItemDetailsModal'
import CameraModal from '../components/shared/CameraModal'
import  Sidebar  from '../components/shared/Sidebar';

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

  // --- All your state and hooks remain unchanged ---
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [itemData, setItemData] = useState({
    name: '',
    brand: '',
    size: '',
    color: '',
    category: 'Tops',
    tags: '',
  })
  
  const [showCamera, setShowCamera] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showItemDetailsModal, setShowItemDetailsModal] = useState(false)
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<ClothingItem | null>(null)
  
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null)
  const [urlReference, setUrlReference] = useState('')
  const [catalogItemData, setCatalogItemData] = useState({
    brand: '',
    size: '',
    color: '',
    tags: ''
  })
  
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({})

  // --- All your functions remain unchanged ---
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessModal(true)
    setTimeout(() => {
      setShowSuccessModal(false)
    }, 2000)
  }

  const handleImageLoad = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }))
  }

  const handleImageError = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: false }))
  }

  const handleImageStart = (itemId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [itemId]: true }))
  }

  const isUrlImage = (imageUrl: string) => {
    if (!imageUrl) return false
    
    const isMediaStorageImage =
      imageUrl.includes('.amazonaws.com') ||
      imageUrl.includes('cloudfront.net') ||
      imageUrl.startsWith('/media/') ||
      imageUrl.includes('storage.googleapis') ||
      (API_BASE_URL && imageUrl.startsWith(API_BASE_URL)) || 
      !imageUrl.startsWith('http');
    
    return imageUrl.startsWith('http') && !isMediaStorageImage
  }

  const shouldUseCors = (imageUrl: string) => {
    return isUrlImage(imageUrl)
  }

  const getProxiedImageUrl = (originalUrl: string) => {
    if (!isUrlImage(originalUrl)) {
      return originalUrl 
    }
    
    return originalUrl
  }

  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
      
      setTimeout(() => resolve(false), 5000)
    })
  }
  
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    const cached = localStorage.getItem('userProfile')
    if (cached) {
      try {
        setUser(JSON.parse(cached))
      }
      catch (e) {
        console.error('Error parsing cached user data:', e)
      }
    }

    const pendingImage = localStorage.getItem('pendingItemImage')
    if (pendingImage) {
      setSelectedImage(pendingImage)
      setShowAddItemModal(true)
      localStorage.removeItem('pendingItemImage')
    }

    const shouldCreateItem = localStorage.getItem('shouldCreateItem')
    if (shouldCreateItem) {
      setShowAddItemModal(true)
      localStorage.removeItem('shouldCreateItem')
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
        const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
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
            image: item.image || item.image_url || '',
            tags: item.tags || [],
            isFavorite: item.is_favorite || false,
            isWorn: item.is_worn || false,
            lastWorn: item.last_worn,
            createdAt: item.created_at
          }))
          setClothingItems(transformedItems)
        }
        else {
          console.error('Failed to fetch clothing items')
        }
      }
      catch (error) {
        console.error('Error fetching clothing items:', error)
      }
      finally {
        setIsLoadingItems(false)
      }
    }

    if (isClient) {
      fetchClothingItems()
    }
  }, [isClient, API_BASE_URL])

  const tabs = ['My Items', 'Browse Catalog']
  const filters = ['All', 'Favorites', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Never Worn', 'Recently Added']

  const totalItems = clothingItems.length
  const recentlyWorn = clothingItems.filter(item => {
    if (!item.lastWorn) return false
    const lastWornDate = new Date(item.lastWorn)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastWornDate > thirtyDaysAgo
  }).length
  const neverWorn = clothingItems.filter(item => !item.isWorn).length
  const favorites = clothingItems.filter(item => item.isFavorite).length

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
    { id: 'c1', name: 'White Button-Down Shirt', category: 'Tops', description: 'Classic collared button-up', commonBrands: ['Uniqlo', 'J.Crew'] },
    { id: 'c2', name: 'Black T-Shirt', category: 'Tops', description: 'Basic crew neck tee', commonBrands: ['Hanes', 'Uniqlo'] },
    { id: 'c3', name: 'White T-Shirt', category: 'Tops', description: 'Basic white tee', commonBrands: ['Hanes', 'Uniqlo'] },
    { id: 'c4', name: 'Striped Long-Sleeve', category: 'Tops', description: 'Navy/white stripes', commonBrands: ['J.Crew', 'Madewell'] },
    { id: 'c5', name: 'Cashmere Sweater', category: 'Tops', description: 'Soft pullover sweater', commonBrands: ['Uniqlo', 'Everlane'] },
    { id: 'c6', name: 'Cardigan', category: 'Tops', description: 'Button-up sweater', commonBrands: ['J.Crew', 'Madewell'] },
    { id: 'c7', name: 'Dark Wash Jeans', category: 'Bottoms', description: 'Classic blue denim', commonBrands: ['Levi\'s', 'Madewell'] },
    { id: 'c8', name: 'Light Wash Jeans', category: 'Bottoms', description: 'Faded blue denim', commonBrands: ['Levi\'s', 'American Eagle'] },
    { id: 'c9', name: 'Black Pants', category: 'Bottoms', description: 'Dress pants or slacks', commonBrands: ['Banana Republic', 'Ann Taylor'] },
    { id: 'c10', name: 'Leggings', category: 'Bottoms', description: 'Stretch athletic pants', commonBrands: ['Lululemon', 'Athleta'] },
    { id: 'c11', name: 'Little Black Dress', category: 'Dresses', description: 'Classic cocktail dress', commonBrands: ['Zara', 'Banana Republic'] },
    { id: 'c12', name: 'Wrap Dress', category: 'Dresses', description: 'Flattering wrap-style', commonBrands: ['DVF', 'J.Crew'] },
    { id: 'c13', name: 'Maxi Dress', category: 'Dresses', description: 'Long flowing dress', commonBrands: ['Free People', 'Anthropologie'] },
    { id: 'c14', name: 'Denim Jacket', category: 'Outerwear', description: 'Classic jean jacket', commonBrands: ['Levi\'s', 'Madewell'] },
    { id: 'c15', name: 'Black Blazer', category: 'Outerwear', description: 'Professional jacket', commonBrands: ['Zara', 'Banana Republic'] },
    { id: 'c16', name: 'Leather Jacket', category: 'Outerwear', description: 'Edgy moto jacket', commonBrands: ['AllSaints', 'Madewell'] },
    { id: 'c17', name: 'White Sneakers', category: 'Shoes', description: 'Classic tennis shoes', commonBrands: ['Adidas', 'Nike'] },
    { id: 'c18', name: 'Black Heels', category: 'Shoes', description: 'Professional pumps', commonBrands: ['Cole Haan', 'Nine West'] },
    { id: 'c19', name: 'Ballet Flats', category: 'Shoes', description: 'Comfortable flat shoes', commonBrands: ['Tory Burch', 'Cole Haan'] },
    { id: 'c20', name: 'Black Belt', category: 'Accessories', description: 'Classic leather belt', commonBrands: ['Coach', 'Kate Spade'] },
    { id: 'c21', name: 'Watch', category: 'Accessories', description: 'Classic timepiece', commonBrands: ['Apple', 'Michael Kors'] },
    { id: 'c22', name: 'Sunglasses', category: 'Accessories', description: 'UV protection eyewear', commonBrands: ['Ray-Ban', 'Oakley'] }
  ]

  const handleAddCatalogItem = async (catalogItem: any) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found')
      return
    }

    setAddedItems(prev => new Set([...prev, catalogItem.id]))

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
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
          is_worn: false,
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
          isWorn: newItemData.is_worn || false,
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }

        setClothingItems(prev => [...prev, newItem])
        showSuccess("Item Added! 🎉")
      }
      else {
        setAddedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(catalogItem.id)
          return newSet
        })
      }
    }
    catch (error) {
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

  const handleAddWithUrl = (catalogItem: any) => {
    setSelectedCatalogItem(catalogItem)
    setCatalogItemData({
      brand: catalogItem.commonBrands[0] || '',
      size: 'M',
      color: 'Various',
      tags: 'wardrobe-essential'
    })
    setUrlReference('')
    setShowUrlModal(true)
  }

  const handleSaveUrlReference = async () => {
    if (!selectedCatalogItem) return

    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please log in to add items')
      return
    }

    if (urlReference.trim()) {
      const isValidUrl = await validateImageUrl(urlReference)
      if (!isValidUrl) {
        const proceed = confirm('The image URL appears to be invalid or unreachable. Do you want to continue anyway?')
        if (!proceed) return
      }
    }

    setIsUploading(true)

    try {
      const imageToSave = urlReference.trim() || ''

      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedCatalogItem.name,
          brand: catalogItemData.brand,
          size: catalogItemData.size,
          color: catalogItemData.color,
          category: selectedCatalogItem.category,
          tags: catalogItemData.tags.split(',').map(tag => tag.trim()),
          is_favorite: false,
          is_worn: false,
          image_url: imageToSave,
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
          isWorn: newItemData.is_worn || false,
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }

        setClothingItems(prev => [...prev, newItem])
        showSuccess("Item Added! 🎉")
        
        setAddedItems(prev => new Set([...prev, selectedCatalogItem.id]))
        setTimeout(() => {
          setAddedItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(selectedCatalogItem.id)
            return newSet
          })
        }, 3000)
        
        setShowUrlModal(false)
        setSelectedCatalogItem(null)
        setUrlReference('')
        setCatalogItemData({ brand: '', size: '', color: '', tags: '' })
      }
      else {
        alert('Failed to add item. Please try again.')
      }
    }
    catch (error) {
      alert('Error adding item. Please check your connection and try again.')
    }
    finally {
      setIsUploading(false)
    }
  }

  const handleToggleFavorite = async (item: ClothingItem) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      alert('Please log in to favorite items')
      return
    }

    const newFavoriteStatus = !item.isFavorite

    const updatedItems = clothingItems.map(clothingItem =>
      clothingItem.id === item.id
        ? { ...clothingItem, isFavorite: newFavoriteStatus }
        : clothingItem
    )
    setClothingItems(updatedItems)

    if (selectedItemForDetails && selectedItemForDetails.id === item.id) {
      setSelectedItemForDetails({ ...selectedItemForDetails, isFavorite: newFavoriteStatus })
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/${item.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_favorite: newFavoriteStatus
        })
      })

      if (!response.ok) {
        setClothingItems(clothingItems)
        if (selectedItemForDetails && selectedItemForDetails.id === item.id) {
          setSelectedItemForDetails(item.id === selectedItemForDetails.id ? { ...selectedItemForDetails, isFavorite: !selectedItemForDetails.isFavorite } : selectedItemForDetails);
        }
        alert('Failed to update favorite status. Please try again.');
      }
    }
    catch (error) {
      setClothingItems(clothingItems)
      if (selectedItemForDetails && selectedItemForDetails.id === item.id) {
        setSelectedItemForDetails(item.id === selectedItemForDetails.id ? { ...selectedItemForDetails, isFavorite: !selectedItemForDetails.isFavorite } : selectedItemForDetails);
      }
      alert('Network error. Please check your connection.');
    }
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
      setShowDeleteModal(false)
      setItemToDelete(null)
      
      setClothingItems(prev => prev.filter(item => item.id !== itemToDelete.id))
      
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/${itemToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        setClothingItems(prev => [...prev, itemToDelete])
        alert('Failed to delete item. Please try again.')
      }
    }
    catch (error) {
      setClothingItems(prev => [...prev, itemToDelete])
      alert('Failed to delete item. Please check your connection.')
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setItemToDelete(null)
  }

  const handlePhotoTakenFromSidebar = (imageData: string) => {
    setSelectedImage(imageData)
    setShowAddItemModal(true)
  }

  const handleCameraClickFromSidebar = () => {
    setShowAddItemModal(true)
  }

  const handlePhotoTakenFromModal = (imageData: string) => {
    setSelectedImage(imageData)
    setShowCameraModal(false)
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
        const result = e.target?.result as string
        setSelectedImage(result)
      }
      reader.onerror = () => {
        alert('Error reading file. Please try again.')
      }
      reader.readAsDataURL(file)
    }
    
    if (event.target) {
      event.target.value = ''
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
      formData.append('is_worn', 'false')
      formData.append('image', blob, 'clothing-item.jpg')

      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/`, {
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
          isWorn: newItemData.is_worn || false,
          lastWorn: newItemData.last_worn,
          createdAt: newItemData.created_at
        }

        setClothingItems(prev => [...prev, newItem])
        setShowSuccessModal(true)
        showSuccess("Item Added! 🎉")
        
        resetForm()
      }
      else {
        const errorText = await response.text()
        alert('Failed to add item. Please try again.')
      }
    }
    catch (error) {
      alert('Error adding item. Please check your connection and try again.')
    }
    finally {
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
    setSelectedItemForDetails(item);
    setShowItemDetailsModal(true);
  }

  const handleCloseItemDetails = () => {
    setShowItemDetailsModal(false);
    setSelectedItemForDetails(null);
  }

  const handleToggleWear = async (itemToUpdate: ClothingItem) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please log in to update items.');
      return;
    }

    const newIsWornStatus = !itemToUpdate.isWorn;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('fr-CA');

    const updatedItems = clothingItems.map(item =>
      item.id === itemToUpdate.id
        ? { ...item, isWorn: newIsWornStatus, lastWorn: newIsWornStatus ? formattedDate : item.lastWorn }
        : item
    );
    setClothingItems(updatedItems);
    setSelectedItemForDetails(updatedItems.find(item => item.id === itemToUpdate.id) || null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/${itemToUpdate.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_worn: newIsWornStatus,
          last_worn: newIsWornStatus ? formattedDate : itemToUpdate.lastWorn,
        })
      });

      if (!response.ok) {
        setClothingItems(clothingItems);
        setSelectedItemForDetails(itemToUpdate);
        alert('Failed to save wear status. Please try again.');
      }
    }
    catch (error) {
      setClothingItems(clothingItems);
      setSelectedItemForDetails(itemToUpdate);
      alert('Network error. Please check your connection.');
    }
  };

  const handleUpdateItem = async (updatedItem: ClothingItem) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please log in to update items.');
      return;
    }
    
    const updatedItems = clothingItems.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setClothingItems(updatedItems);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/clothing-items/${updatedItem.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updatedItem.name,
          brand: updatedItem.brand,
          size: updatedItem.size,
          color: updatedItem.color,
          category: updatedItem.category,
          tags: updatedItem.tags,
          is_favorite: updatedItem.isFavorite,
        })
      });

      if (!response.ok) {
        setClothingItems(clothingItems);
        alert('Failed to update item. Please try again.');
      }
      else {
        const responseData = await response.json();
        const newUpdatedItem = {
          ...updatedItem,
          tags: responseData.tags
        };
        setSelectedItemForDetails(newUpdatedItem);
      }
    }
    catch (error) {
      setClothingItems(clothingItems);
      alert('Network error. Please check your connection.');
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F5F3EC] flex">
        {/* Assuming sidebar is hidden during initial load */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-[#F5F3EC] border-t-[#0B2C21] rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium" style={{ fontFamily: 'Inter' }}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3EC] flex">
      {showSuccessModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {successMessage}
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                Your item is now in your closet!
              </p>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        user={user} 
        onShowSettings={() => {}}
      />

      <main className="flex-1 w-full md:ml-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 gap-4 border-b border-gray-200/80">
          <div className="relative">
            {/* This code uses your original inline styles to ensure the hanger's placement
              and the text's appearance are exactly what you specified. The rest of the
              page remains responsive for mobile-friendliness.
            */}
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

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search your closet"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-2 border-gray-300 rounded-full py-3 pl-12 pr-4 text-gray-600 focus:outline-none focus:border-gray-400 shadow-md text-sm w-full md:w-72"
              />
            </div>
            <button 
              onClick={openAddItemModal}
              className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center justify-center space-x-2 hover:opacity-90 shadow-md w-full sm:w-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
                Add Items
              </span>
            </button>
          </div>
        </div>
        
        <div className="px-4 md:px-6 pt-4">
          <div className="inline-flex bg-white p-1 rounded-full shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-full text-sm font-medium transition-all ${
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
            <div className="px-4 md:px-6 mt-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{totalItems}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{recentlyWorn}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>Recently Worn</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{neverWorn}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>Never Worn</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{favorites}</div>
                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>Favorites</div>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 mt-4 mb-8">
              <div className="flex overflow-x-auto space-x-3 pb-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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

            <div className="px-4 md:px-6 pb-6">
              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4">
                    <div className="w-12 h-12 border-4 border-[#F5F3EC] border-t-[#0B2C21] rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium" style={{ fontFamily: 'Inter' }}>Loading your closet...</p>
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
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-xl shadow-lg overflow-hidden group relative cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out w-full"
                    >
                      <div
                        onClick={() => handleOpenItemDetails(item)}
                        className="cursor-pointer"
                      >
                        <div className="relative h-64 sm:h-80 bg-gray-50 overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            {item.image ? (
                              <>
                                {imageLoadingStates[item.id] && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <div className="w-8 h-8">
                                      <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0B2C21] rounded-full animate-spin"></div>
                                    </div>
                                  </div>
                                )}
                                <img
                                  src={getProxiedImageUrl(item.image)}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onLoadStart={() => handleImageStart(item.id)}
                                  onLoad={() => handleImageLoad(item.id)}
                                  onError={(e) => {
                                    handleImageError(item.id)
                                    if (shouldUseCors(item.image) && e.currentTarget.crossOrigin) {
                                      e.currentTarget.crossOrigin = ''
                                      e.currentTarget.src = item.image
                                      return
                                    }
                                    
                                    e.currentTarget.style.display = 'none'
                                    const parent = e.currentTarget.parentElement
                                    if (parent && !parent.querySelector('.fallback-icon')) {
                                      const fallbackDiv = document.createElement('div')
                                      fallbackDiv.className = 'fallback-icon flex items-center justify-center w-full h-full'
                                      fallbackDiv.innerHTML = `<div class="w-16 h-16 text-gray-300">${getCategoryIcon(item.category)}</div>`
                                      parent.appendChild(fallbackDiv)
                                    }
                                  }}
                                  crossOrigin={shouldUseCors(item.image) ? "anonymous" : undefined}
                                  referrerPolicy="no-referrer"
                                />
                              </>
                            ) : (
                              <div className="w-16 h-16 text-gray-300">
                                {getCategoryIcon(item.category)}
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute top-3 left-3 bg-gray-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
                            {getCategoryLabel(item.category)}
                          </div>
                          
                          {isUrlImage(item.image) && (
                            <div className="absolute top-3 right-20 bg-blue-500 bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                              <Link className="w-3 h-3" />
                              <span>URL</span>
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFavorite(item)
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
                              item.isFavorite 
                                ? 'bg-yellow-500 text-white shadow-md' 
                                : 'bg-white/90 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                            }`}
                            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenItemDetails(item)
                              }}
                              className="p-2 bg-white text-black rounded-full hover:bg-gray-50 transition-colors shadow-lg"
                              title="Edit item"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteItem(item)
                              }}
                              className="p-2 bg-white text-red-500 rounded-full hover:bg-gray-50 transition-colors shadow-lg"
                              title="Delete item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="font-semibold text-gray-800 mb-1 text-base truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {item.name}
                          </h3>
                          
                          <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
                            {item.brand} • Size {item.size} • {item.color}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                style={{ fontFamily: 'Inter' }}
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded" style={{ fontFamily: 'Inter' }}>
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleWear(item)
                            }}
                            className={`w-full py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors ${
                              item.isWorn ? 'bg-[#2A5F4F] text-white hover:bg-[#0B2C21]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {item.isWorn ? 'Worn' : 'Not Worn'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'Browse Catalog' && (
          <>
            <div className="px-4 md:px-6 mt-8 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Browse Wardrobe Essentials
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                Quickly add common items you already own to your closet
              </p>
            </div>

            <div className="px-4 md:px-6 pb-6">
              <div className="flex overflow-x-auto space-x-3 pb-2 mb-8">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCatalogFilteredItems().map(item => (
                  <div key={item.id} className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
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
                      <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Inter' }}>
                        Common Brands: {item.commonBrands.join(', ')}
                      </p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAddCatalogItem(item)}
                          className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors ${
                            addedItems.has(item.id) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {addedItems.has(item.id) ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Quick Add</span>
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleAddWithUrl(item)}
                          className="px-3 py-2 rounded-lg text-sm bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center"
                          title="Add with URL reference"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {showAddItemModal && (
        <AddItemModal
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleFileUpload={handleFileUpload}
          handleInputChange={handleInputChange}
          itemData={itemData}
          handleSaveItem={handleSaveItem}
          isUploading={isUploading}
          onClose={resetForm}
          fileInputRef={fileInputRef}
          onCameraClick={() => setShowCameraModal(true)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {showItemDetailsModal && selectedItemForDetails && (
        <ItemDetailsModal 
          item={selectedItemForDetails}
          onClose={handleCloseItemDetails}
          onToggleWear={handleToggleWear}
          onUpdateItem={handleUpdateItem}
          onDelete={() => handleDeleteItem(selectedItemForDetails)}
        />
      )}

      {showUrlModal && selectedCatalogItem && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-2xl border border-white/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Add {selectedCatalogItem.name}
              </h3>
              <button 
                onClick={() => setShowUrlModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={urlReference}
                  onChange={(e) => setUrlReference(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-800"
                  style={{ fontFamily: 'Inter' }}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Add a reference image URL from shopping sites or your photos
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={catalogItemData.brand}
                  onChange={(e) => setCatalogItemData(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-800"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                    Size
                  </label>
                  <input
                    type="text"
                    value={catalogItemData.size}
                    onChange={(e) => setCatalogItemData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-800"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                    Color
                  </label>
                  <input
                    type="text"
                    value={catalogItemData.color}
                    onChange={(e) => setCatalogItemData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-800"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={catalogItemData.tags}
                  onChange={(e) => setCatalogItemData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="casual, work, summer"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21] text-gray-800"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>
            </div>
            
            <div className="flex justify-center space-x-4 mt-6">
              <button 
                onClick={() => setShowUrlModal(false)}
                className="px-6 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUrlReference}
                disabled={isUploading}
                className="px-6 py-2 rounded-lg bg-[#0B2C21] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Inter' }}
              >
                {isUploading ? 'Adding...' : 'Add to Closet'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoTaken={handlePhotoTakenFromModal}
      />

      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Delete Item
            </h3>
            <p className="mb-6 text-gray-700" style={{ fontFamily: 'Inter' }}>
              Are you sure you want to delete <span className="font-bold text-gray-900">{itemToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={cancelDelete}
                className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteItem}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                style={{ fontFamily: 'Inter' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}