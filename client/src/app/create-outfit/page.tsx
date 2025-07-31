'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, X, Save, Trash2, Edit, Camera, Upload, Move, RotateCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/shared/Sidebar'

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

interface OutfitItem {
  clothingItem: ClothingItem
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
}

interface Outfit {
  id: string
  title: string
  description: string
  occasion: string
  tags: string[]
  items: OutfitItem[]
  thumbnail: string
  created_at: string
}

interface User {
  username: string
  avatar?: string
}

export default function OutfitCreatorPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([])
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  
  // Outfit creation states
  const [currentOutfit, setCurrentOutfit] = useState<OutfitItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [outfitData, setOutfitData] = useState({
    title: '',
    description: '',
    occasion: '',
    tags: ''
  })
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('Create Outfit')
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filters = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']
  const tabs = ['Create Outfit', 'My Outfits']

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
            isWorn: item.is_worn || false,
            lastWorn: item.last_worn,
            createdAt: item.created_at
          }))
          setClothingItems(transformedItems)
        }
      } catch (error) {
        console.error('Error fetching clothing items:', error)
      } finally {
        setIsLoadingItems(false)
      }
    }

    if (isClient) {
      fetchClothingItems()
      // Mock saved outfits for now - replace with API call later
      setSavedOutfits([])
    }
  }, [isClient])

  const filteredItems = clothingItems.filter(item => {
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleAddItemToOutfit = (item: ClothingItem) => {
    const newOutfitItem: OutfitItem = {
      clothingItem: item,
      x: Math.random() * 200 + 50, // Random position
      y: Math.random() * 200 + 50,
      width: 120,
      height: 160,
      rotation: 0,
      zIndex: currentOutfit.length + 1
    }
    setCurrentOutfit(prev => [...prev, newOutfitItem])
  }

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setSelectedItemId(itemId)
    setDragStart({ x: e.clientX, y: e.clientY })
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedItemId || !dragStart) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    setCurrentOutfit(prev => prev.map(item => {
      if (item.clothingItem.id === selectedItemId) {
        return {
          ...item,
          x: Math.max(0, item.x + deltaX),
          y: Math.max(0, item.y + deltaY)
        }
      }
      return item
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setSelectedItemId(null)
    setDragStart(null)
  }

  const handleRemoveItem = (itemId: string) => {
    setCurrentOutfit(prev => prev.filter(item => item.clothingItem.id !== itemId))
  }

  const handleRotateItem = (itemId: string) => {
    setCurrentOutfit(prev => prev.map(item => {
      if (item.clothingItem.id === itemId) {
        return { ...item, rotation: (item.rotation + 45) % 360 }
      }
      return item
    }))
  }

  const handleResizeItem = (itemId: string, newWidth: number, newHeight: number) => {
    setCurrentOutfit(prev => prev.map(item => {
      if (item.clothingItem.id === itemId) {
        return { ...item, width: Math.max(80, newWidth), height: Math.max(100, newHeight) }
      }
      return item
    }))
  }

  const handleSaveOutfit = async () => {
    if (!outfitData.title.trim()) {
      alert('Please enter an outfit title')
      return
    }

    if (currentOutfit.length === 0) {
      alert('Please add some items to your outfit')
      return
    }

    // Generate thumbnail (simplified for MVP)
    const thumbnailCanvas = document.createElement('canvas')
    thumbnailCanvas.width = 300
    thumbnailCanvas.height = 400
    const ctx = thumbnailCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f5f3ec'
      ctx.fillRect(0, 0, 300, 400)
    }
    const thumbnail = thumbnailCanvas.toDataURL()

    const newOutfit: Outfit = {
      id: Date.now().toString(),
      title: outfitData.title,
      description: outfitData.description,
      occasion: outfitData.occasion,
      tags: outfitData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      items: currentOutfit,
      thumbnail,
      created_at: new Date().toISOString()
    }

    // For MVP, save to localStorage - replace with API call later
    setSavedOutfits(prev => [newOutfit, ...prev])
    
    // Reset form
    setCurrentOutfit([])
    setOutfitData({ title: '', description: '', occasion: '', tags: '' })
    setShowSaveModal(false)
    setShowSuccessMessage(true)
    
    setTimeout(() => setShowSuccessMessage(false), 2000)
  }

  const clearCanvas = () => {
    setCurrentOutfit([])
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
    <div className="min-h-screen bg-[#F5F3EC] flex">
      <Sidebar 
        user={user} 
        onLogTodaysLook={() => {}} 
        onShowSettings={() => {}}
      />

      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="relative">
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: '#0B2C21',
              letterSpacing: '0.025em',
            }}>
              Outfit Creator
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === 'Create Outfit' && (
              <>
                <button 
                  onClick={clearCanvas}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:opacity-90"
                  style={{ fontFamily: 'Inter' }}
                >
                  Clear Canvas
                </button>
                <button 
                  onClick={() => setShowSaveModal(true)}
                  disabled={currentOutfit.length === 0}
                  className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 disabled:opacity-50"
                  style={{ fontFamily: 'Inter' }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Outfit</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
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

        {activeTab === 'Create Outfit' && (
          <div className="flex h-[calc(100vh-200px)]">
            {/* Clothing Items Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search items"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2C21]"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
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

              <div className="p-4">
                {isLoadingItems ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading items...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleAddItemToOutfit(item)}
                        className="bg-gray-50 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-colors group"
                      >
                        <div className="aspect-square bg-white rounded-md mb-2 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-medium text-gray-800 truncate" style={{ fontFamily: 'Inter' }}>
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate" style={{ fontFamily: 'Inter' }}>
                          {item.brand}
                        </p>
                        <button className="w-full mt-2 py-1 bg-[#0B2C21] text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Add to Outfit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Outfit Canvas */}
            <div className="flex-1 bg-gray-50 relative overflow-hidden">
              <div
                ref={canvasRef}
                className="w-full h-full relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {currentOutfit.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Start Creating Your Outfit
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                        Click on items from your closet to add them to the canvas
                      </p>
                    </div>
                  </div>
                ) : (
                  currentOutfit.map((outfitItem) => (
                    <div
                      key={outfitItem.clothingItem.id}
                      className={`absolute cursor-move group ${selectedItemId === outfitItem.clothingItem.id ? 'ring-2 ring-[#0B2C21]' : ''}`}
                      style={{
                        left: outfitItem.x,
                        top: outfitItem.y,
                        width: outfitItem.width,
                        height: outfitItem.height,
                        transform: `rotate(${outfitItem.rotation}deg)`,
                        zIndex: outfitItem.zIndex,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, outfitItem.clothingItem.id)}
                    >
                      <div className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden">
                        {outfitItem.clothingItem.image ? (
                          <img
                            src={outfitItem.clothingItem.image}
                            alt={outfitItem.clothingItem.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Item Controls */}
                      <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRotateItem(outfitItem.clothingItem.id)
                          }}
                          className="p-1 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveItem(outfitItem.clothingItem.id)
                          }}
                          className="p-1 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Resize Handle */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-[#0B2C21] cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const startX = e.clientX
                          const startY = e.clientY
                          const startWidth = outfitItem.width
                          const startHeight = outfitItem.height

                          const handleResize = (e: MouseEvent) => {
                            const newWidth = startWidth + (e.clientX - startX)
                            const newHeight = startHeight + (e.clientY - startY)
                            handleResizeItem(outfitItem.clothingItem.id, newWidth, newHeight)
                          }

                          const handleResizeEnd = () => {
                            document.removeEventListener('mousemove', handleResize)
                            document.removeEventListener('mouseup', handleResizeEnd)
                          }

                          document.addEventListener('mousemove', handleResize)
                          document.addEventListener('mouseup', handleResizeEnd)
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'My Outfits' && (
          <div className="p-6">
            {savedOutfits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  No Outfits Yet
                </h3>
                <p className="text-gray-600 mb-4" style={{ fontFamily: 'Inter' }}>
                  Create your first outfit to see it here
                </p>
                <button
                  onClick={() => setActiveTab('Create Outfit')}
                  className="bg-[#0B2C21] text-white px-6 py-3 rounded-full hover:opacity-90"
                  style={{ fontFamily: 'Inter' }}
                >
                  Create First Outfit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {savedOutfits.map((outfit) => (
                  <div key={outfit.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] bg-gray-100">
                      <img
                        src={outfit.thumbnail}
                        alt={outfit.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Inter' }}>
                        {outfit.title}
                      </h3>
                      {outfit.occasion && (
                        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
                          {outfit.occasion}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {outfit.tags.map((tag, index) => (
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Outfit Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-md p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Save Your Outfit
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Outfit Title
                </label>
                <input
                  type="text"
                  value={outfitData.title}
                  onChange={(e) => setOutfitData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21]"
                  placeholder="e.g., Date Night Look"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Occasion
                </label>
                <input
                  type="text"
                  value={outfitData.occasion}
                  onChange={(e) => setOutfitData(prev => ({ ...prev, occasion: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21]"
                  placeholder="e.g., Work, Casual, Party"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Description
                </label>
                <textarea
                  value={outfitData.description}
                  onChange={(e) => setOutfitData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21]"
                  placeholder="Describe your outfit..."
                  style={{ fontFamily: 'Inter' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Tags
                </label>
                <input
                  type="text"
                  value={outfitData.tags}
                  onChange={(e) => setOutfitData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21]"
                  placeholder="e.g., summer, elegant, comfortable"
                  style={{ fontFamily: 'Inter' }}
                />
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                  Separate tags with commas
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveOutfit}
                className="bg-[#0B2C21] text-white px-6 py-3 rounded-full hover:opacity-90"
                style={{ fontFamily: 'Inter' }}
              >
                Save Outfit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Outfit Saved! 🎉
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
              Your outfit has been added to your collection!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}