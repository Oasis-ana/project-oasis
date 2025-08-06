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
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4 lg:p-0">
      <div className="bg-white rounded-lg w-full lg:w-auto max-w-4xl max-h-[85vh] lg:max-h-none overflow-hidden shadow-xl border border-white/20">
        
        {/* Header - improved mobile layout */}
        <div className="flex items-start lg:items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-lg lg:text-xl font-semibold text-[#0B2C21] leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              {outfit.title}
            </h2>
            {outfit.description && (
              <p className="text-gray-600 mt-1 text-sm lg:text-base leading-relaxed" style={{ fontFamily: 'Inter' }}>
                {outfit.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 lg:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Close outfit view"
          >
            <X className="w-5 h-5 lg:w-5 lg:h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - improved mobile scrolling and spacing */}
        <div className="p-4 lg:p-8 max-h-[calc(85vh-120px)] lg:max-h-none overflow-y-auto -webkit-overflow-scrolling-touch">
          
          {/* Items grid - responsive and mobile-optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 justify-items-center">
            {outfit.items.map((item, index) => (
              <div
                key={item.id}
                className="relative bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow w-full max-w-[160px] sm:max-w-[180px] lg:max-w-[200px]"
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
                      <Shirt className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 lg:p-3">
                  <p className="text-xs lg:text-sm font-medium truncate" style={{ fontFamily: 'Inter' }}>
                    {item.name}
                  </p>
                  <p className="text-xs opacity-75" style={{ fontFamily: 'Inter' }}>
                    {item.brand} • {item.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer info - improved mobile spacing */}
          <div className="mt-6 lg:mt-8 text-center pb-4 lg:pb-0">
            <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter' }}>
              Created on {new Date(outfit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}