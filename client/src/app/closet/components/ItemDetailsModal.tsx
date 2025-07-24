import { X, Check, Shirt, Package, Crown, ShirtIcon, Star, Zap } from 'lucide-react'
import React from 'react'

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

interface ItemDetailsModalProps {
  isOpen: boolean
  item: ClothingItem | null
  onClose: () => void
  onToggleWear: (item: ClothingItem) => void // UPDATED: New prop name and type
}

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

const ItemDetailsModal = ({ isOpen, item, onClose, onToggleWear }: ItemDetailsModalProps) => {
  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
            Item Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          <div className="flex-shrink-0">
            <div className="w-full md:w-64 h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shadow-md">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-300">{getCategoryIcon(item.category)}</div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {item.name}
            </h4>
            <div className="space-y-2 text-gray-600" style={{ fontFamily: 'Inter' }}>
              <p>
                <span className="font-semibold text-gray-800">Brand:</span> {item.brand}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Category:</span> {item.category}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Size:</span> {item.size}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Color:</span> {item.color}
              </p>
              {/* UPDATED: Displays "Worn" or "Not Worn" status */}
              <p>
                <span className="font-semibold text-gray-800">Status:</span> {item.isWorn ? 'Worn' : 'Not Worn'}
              </p>
              {item.lastWorn && (
                <p>
                  <span className="font-semibold text-gray-800">Last Worn:</span> {new Date(item.lastWorn).toLocaleDateString()}
                </p>
              )}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-6">
                <button
                    onClick={() => onToggleWear(item)} // UPDATED: Calls the new function
                    className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors
                        ${item.isWorn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#0B2C21] text-white hover:opacity-90'}
                    `}
                    style={{ fontFamily: 'Inter' }}
                >
                    <Check className="w-4 h-4" />
                    <span>
                        {item.isWorn ? 'Mark as Not Worn' : 'Mark as Worn'}
                    </span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailsModal