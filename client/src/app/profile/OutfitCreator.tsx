'use client'

import { useState, useEffect } from 'react'
import { Search, Home, Camera, Bell, Settings, Plus } from 'lucide-react'

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
  timesWorn: number
}

interface Outfit {
  id: string
  title: string
  description: string
  items: ClothingItem[]
  thumbnail: string
}

export default function OutfitCreator() {
  const [activeTab, setActiveTab] = useState('create')
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([])
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([])
  const [outfitTitle, setOutfitTitle] = useState('')
  const [outfitDescription, setOutfitDescription] = useState('')
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])

  useEffect(() => {
    const storedCloset = localStorage.getItem('closetItems')
    if (storedCloset) {
      setClosetItems(JSON.parse(storedCloset))
    }

    const storedOutfits = localStorage.getItem('savedOutfits')
    if (storedOutfits) {
      setSavedOutfits(JSON.parse(storedOutfits))
    }
  }, [])

  const handleToggleItem = (item: ClothingItem) => {
    const exists = selectedItems.find(i => i.id === item.id)
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const handleSaveOutfit = () => {
    if (!outfitTitle || selectedItems.length === 0) return

    const newOutfit: Outfit = {
      id: Date.now().toString(),
      title: outfitTitle,
      description: outfitDescription,
      items: selectedItems,
      thumbnail: selectedItems[0].image,
    }

    const updatedOutfits = [newOutfit, ...savedOutfits]
    setSavedOutfits(updatedOutfits)
    localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits))

    setOutfitTitle('')
    setOutfitDescription('')
    setSelectedItems([])
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === 'create' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('create')}
          >
            Create Outfit
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === 'myOutfits' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('myOutfits')}
          >
            My Outfits
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Start a new outfit
          </h2>
          <input
            type="text"
            placeholder="Outfit Title"
            value={outfitTitle}
            onChange={e => setOutfitTitle(e.target.value)}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Outfit Description"
            value={outfitDescription}
            onChange={e => setOutfitDescription(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {closetItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item)}
                className={`cursor-pointer border rounded-lg overflow-hidden shadow-sm ${
                  selectedItems.find(i => i.id === item.id)
                    ? 'border-black ring-2 ring-black'
                    : 'border-gray-200'
                }`}
              >
                <img src={item.image} alt={item.name} className="w-full h-64 object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveOutfit}
            className="bg-black text-white px-6 py-2 rounded-full font-medium"
          >
            Save Outfit
          </button>
        </div>
      )}

      {activeTab === 'myOutfits' && (
        <div>
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            My Saved Outfits
          </h2>
          {savedOutfits.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                No outfits yet
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
                Save your outfits and they’ll appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {savedOutfits.map(outfit => (
                <div key={outfit.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={outfit.thumbnail}
                    alt={outfit.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {outfit.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Inter' }}>
                      {outfit.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {outfit.items.length} items
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
