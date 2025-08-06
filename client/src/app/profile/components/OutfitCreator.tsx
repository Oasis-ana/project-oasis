'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Search, Plus, Shirt, Check, X } from 'lucide-react'

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

export interface NewOutfitData {
  title: string
  description: string
  items: ClothingItem[]
  category: string
  tags: string[]
}

interface OutfitCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSaveOutfit: (outfitData: NewOutfitData) => void
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000'

export default function OutfitCreator({ isOpen, onClose, onSaveOutfit }: OutfitCreatorProps) {
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([])
  const [outfitTitle, setOutfitTitle] = useState('')
  const [outfitDescription, setOutfitDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [draggedItem, setDraggedItem] = useState<ClothingItem | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'closet'>('details')
  const [touchDragItem, setTouchDragItem] = useState<ClothingItem | null>(null)
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null)

  const filters = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories']

  useEffect(() => {
    if (isOpen) {
      fetchClothingItems()
      setErrorMessage('')
    }
  }, [isOpen])

  const fetchClothingItems = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setErrorMessage('Please log in to access your closet')
      setIsLoadingItems(false)
      return
    }

    try {
      setIsLoadingItems(true)
      const response = await fetch(`${API_URL}/api/auth/clothing-items/`, {
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
          image: item.image || '',
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          isWorn: item.is_worn || false,
          lastWorn: item.last_worn,
          createdAt: item.created_at
        }))
        setClosetItems(transformedItems)
      } else {
        setErrorMessage('Failed to load closet items')
      }
    } catch (error) {
      setErrorMessage('Network error loading closet items')
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleSaveOutfit = () => {
    setErrorMessage('')
    if (!outfitTitle.trim()) {
      setErrorMessage('Please add a title for your outfit')
      return
    }
    if (selectedItems.length === 0) {
      setErrorMessage('Please select at least one item for your outfit')
      return
    }

    const newOutfitData: NewOutfitData = {
      title: outfitTitle.trim(),
      description: outfitDescription.trim(),
      items: selectedItems,
      category: 'Saved',
      tags: []
    }

    onSaveOutfit(newOutfitData)
    handleClose()
  }

  const handleClose = () => {
    setOutfitTitle('')
    setOutfitDescription('')
    setSelectedItems([])
    setSearchQuery('')
    setActiveFilter('All')
    setErrorMessage('')
    setActiveTab('details')
    onClose()
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
  
  const handleTouchStart = (e: React.TouchEvent, item: ClothingItem) => {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    setTouchDragItem(item)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragItem || !touchStartPos) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)
    
    if (deltaX > 10 || deltaY > 10) {
      e.preventDefault()
      setDraggedItem(touchDragItem)
    }
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragItem) return
    
    const touch = e.changedTouches[0]
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    const outfitBoard = elementBelow?.closest('[data-outfit-board]')
    
    if (outfitBoard && draggedItem) {
      const exists = selectedItems.find(i => i.id === draggedItem.id)
      if (!exists) {
        setSelectedItems([...selectedItems, draggedItem])
      }
    }
    
    setTouchDragItem(null)
    setTouchStartPos(null)
    setDraggedItem(null)
    setIsDragOver(false)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-2 lg:p-0">
      <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[100vh] lg:max-h-[90vh] overflow-hidden shadow-xl border border-white/20">
        {/* Header - improved mobile spacing and touch targets */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-6 border-b border-gray-200 space-y-3 lg:space-y-0">
          <div className="flex items-center justify-between lg:justify-start lg:space-x-4">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button 
                onClick={handleClose} 
                className="p-2.5 lg:p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Close outfit creator"
              >
                <ArrowLeft className="w-5 h-5 lg:w-5 lg:h-5 text-gray-500" />
              </button>
              <h2 className="text-lg lg:text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Create New Outfit
              </h2>
            </div>
            {/* Save button - improved mobile touch target */}
            <button
              onClick={handleSaveOutfit}
              disabled={!outfitTitle.trim() || selectedItems.length === 0}
              className={`px-5 lg:px-6 py-2.5 lg:py-2 rounded-full flex items-center space-x-2 font-medium text-sm transition-all touch-manipulation min-h-[44px] ${
                !outfitTitle.trim() || selectedItems.length === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-[#0B2C21] text-white hover:opacity-90 active:scale-95'
              }`}
              style={{ fontFamily: 'Inter' }}
            >
              Save
            </button>
          </div>
          
          {/* Mobile tab navigation - improved touch targets */}
          <div className="flex lg:hidden bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                activeTab === 'details'
                  ? 'bg-white text-[#0B2C21] shadow-sm'
                  : 'text-gray-600'
              }`}
              style={{ fontFamily: 'Inter' }}
            >
              Details ({selectedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('closet')}
              className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-colors touch-manipulation ${
                activeTab === 'closet'
                  ? 'bg-white text-[#0B2C21] shadow-sm'
                  : 'text-gray-600'
              }`}
              style={{ fontFamily: 'Inter' }}
            >
              Closet
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-3 lg:mx-6 mt-3 lg:mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm" style={{ fontFamily: 'Inter' }}>{errorMessage}</p>
          </div>
        )}

        {/* Content - improved mobile height calculation */}
        <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Details Panel */}
          <div className={`${activeTab === 'details' ? 'block' : 'hidden'} lg:block lg:w-1/3 p-3 lg:p-6 lg:border-r border-gray-200 flex flex-col overflow-hidden`}>
            <div className="mb-4 lg:mb-6 flex-shrink-0">
              <h3 className="text-base lg:text-lg font-medium text-[#0B2C21] mb-3 lg:mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Outfit Details</h3>
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>Outfit Title *</label>
                  <input 
                    type="text" 
                    value={outfitTitle} 
                    onChange={(e) => setOutfitTitle(e.target.value)} 
                    placeholder="e.g., Casual Weekend Look" 
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900 text-base lg:text-sm" 
                    style={{ fontFamily: 'Inter' }} 
                    maxLength={100} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter' }}>Description (optional)</label>
                  <textarea 
                    value={outfitDescription} 
                    onChange={(e) => setOutfitDescription(e.target.value)} 
                    placeholder="Perfect for..." 
                    rows={3} 
                    className="w-full px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900 resize-none text-base lg:text-sm" 
                    style={{ fontFamily: 'Inter' }} 
                    maxLength={500} 
                  />
                </div>
              </div>
            </div>
            
            {/* Outfit Board - improved scrolling */}
            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              <h4 className="text-sm lg:text-md font-medium text-gray-700 mb-3 sticky top-0 bg-white z-10 py-1" style={{ fontFamily: 'Inter' }}>
                Outfit Board ({selectedItems.length} items)
              </h4>
              <div 
                className={`min-h-[200px] lg:min-h-[400px] border-2 border-dashed rounded-lg p-3 lg:p-4 transition-all ${
                  isDragOver 
                    ? 'border-[#0B2C21] bg-[#0B2C21]/5' 
                    : selectedItems.length === 0 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-200 bg-white'
                }`} 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop}
                data-outfit-board="true"
              >
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8 lg:py-16">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3 lg:mb-4">
                      <Plus className="w-6 h-6 lg:w-8 lg:h-8 text-gray-300" />
                    </div>
                    <p className="text-center text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>
                      Drag items here to create your outfit
                    </p>
                    <p className="text-center text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter' }}>
                      or tap items from your closet to add them
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-3">
                    {selectedItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" 
                        style={{ transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 3)}deg)` }}
                      >
                        <div className="aspect-square p-1.5 lg:p-2">
                          <div className="w-full h-4/5 bg-gray-100 rounded mb-1.5 lg:mb-2">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                                <Shirt className="w-4 h-4 lg:w-6 lg:h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="h-1/5 flex flex-col justify-center">
                            <p className="text-xs font-medium truncate text-gray-900" style={{ fontFamily: 'Inter' }}>{item.name}</p>
                            <p className="text-xs opacity-75 text-gray-600" style={{ fontFamily: 'Inter' }}>{item.category}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeSelectedItem(item.id)} 
                          className="absolute top-1 right-1 lg:top-2 lg:right-2 p-2 lg:p-1 bg-red-500 text-white rounded-full opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 touch-manipulation min-h-[28px] min-w-[28px] lg:min-h-[24px] lg:min-w-[24px]"
                        >
                          <X className="w-3 h-3 lg:w-3 lg:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Closet Panel */}
          <div className={`${activeTab === 'closet' ? 'block' : 'hidden'} lg:block flex-1 flex flex-col overflow-hidden`}>
            {/* Search and filters - sticky on mobile */}
            <div className="p-3 lg:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
              <div className="flex items-center space-x-3 lg:space-x-4 mb-3 lg:mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search your closet" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900 text-base lg:text-sm" 
                    style={{ fontFamily: 'Inter' }} 
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {filters.map((filter) => (
                  <button 
                    key={filter} 
                    onClick={() => setActiveFilter(filter)} 
                    className={`px-3 lg:px-4 py-2 lg:py-2 rounded-full text-sm lg:text-sm font-medium transition-all touch-manipulation min-h-[36px] ${
                      activeFilter === filter 
                        ? 'bg-[#0B2C21] text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-300'
                    }`} 
                    style={{ fontFamily: 'Inter' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Items grid - improved mobile scrolling */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-6 -webkit-overflow-scrolling-touch">
              {isLoadingItems ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>Loading your closet...</p>
                </div>
              ) : errorMessage && closetItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shirt className="w-6 h-6 lg:w-8 lg:h-8 text-red-300" />
                  </div>
                  <p className="text-red-600 mb-2 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>{errorMessage}</p>
                  <button onClick={fetchClothingItems} className="text-sm text-[#0B2C21] hover:underline py-2 px-4 touch-manipulation" style={{ fontFamily: 'Inter' }}>
                    Try again
                  </button>
                </div>
              ) : closetItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shirt className="w-6 h-6 lg:w-8 lg:h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-600 mb-2 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>Your closet is empty</p>
                  <p className="text-xs lg:text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>Add some clothing items first to create outfits</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>No items found</p>
                  <p className="text-xs lg:text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4 pb-4">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItems.find(i => i.id === item.id)
                    return (
                      <div 
                        key={item.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, item)}
                        onTouchStart={(e) => handleTouchStart(e, item)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => handleToggleItem(item)} 
                        className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:shadow-md select-none touch-manipulation ${
                          isSelected 
                            ? 'border-[#0B2C21] ring-2 ring-[#0B2C21] ring-opacity-20' 
                            : 'border-gray-200'
                        } ${draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''} active:scale-95`} 
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="aspect-square bg-gray-100">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover pointer-events-none" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Shirt className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-[#0B2C21] text-white rounded-full p-1.5 lg:p-1">
                            <Check className="w-4 h-4 lg:w-4 lg:h-4" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                          <p className="text-xs font-medium truncate" style={{ fontFamily: 'Inter' }}>{item.name}</p>
                          <p className="text-xs opacity-75" style={{ fontFamily: 'Inter' }}>{item.category}</p>
                        </div>
                        <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity hidden lg:block">
                          <div className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">Drag me!</div>
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