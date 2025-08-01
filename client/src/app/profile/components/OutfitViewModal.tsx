'use client'

import { X, Shirt } from 'lucide-react'

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

interface Outfit {
  id: string
  title: string
  description: string
  items: ClothingItem[]
  thumbnail: string
  createdAt: string
  isFavorite?: boolean
}

interface OutfitViewModalProps {
  isOpen: boolean
  onClose: () => void
  outfit: Outfit | null
}

export default function OutfitViewModal({ isOpen, onClose, outfit }: OutfitViewModalProps) {
  if (!isOpen || !outfit) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-white/20">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
              {outfit.title}
            </h2>
            {outfit.description && (
              <p className="text-gray-600 mt-1" style={{ fontFamily: 'Inter' }}>
                {outfit.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
            {outfit.items.map((item, index) => (
              <div 
                key={item.id} 
                className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow max-w-[200px]"
                style={{
                  transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (Math.random() * 4 + 1)}deg)`,
                }}
              >
                <div className="aspect-square">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Shirt className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3">
                  <p className="text-sm font-medium truncate" style={{ fontFamily: 'Inter' }}>
                    {item.name}
                  </p>
                  <p className="text-xs opacity-75" style={{ fontFamily: 'Inter' }}>
                    {item.brand} • {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
              Created on {new Date(outfit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}