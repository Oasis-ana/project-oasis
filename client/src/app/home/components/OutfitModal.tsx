'use client'

import { Heart } from 'lucide-react'

interface Outfit {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  category: string
  timePosted: string
  liked: boolean
  created_at: string
}

interface OutfitCardProps {
  outfit: Outfit
  onLike: (outfitId: string) => void
  onClick: (outfit: Outfit) => void
  formatTimePosted: (dateString: string) => string
}

export default function OutfitCard({ outfit, onLike, onClick, formatTimePosted }: OutfitCardProps) {
  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] duration-300"
      onClick={() => onClick(outfit)}
    >
      {/* Image with time badge - Pinterest-style tall aspect ratio */}
      <div className="relative">
        <img
          src={outfit.image}
          alt={outfit.title}
          className="w-full h-80 object-cover object-center"
          style={{ aspectRatio: '3/4' }}
        />
        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
          {formatTimePosted(outfit.created_at)}
        </div>
        
        {/* Like button overlay */}
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onLike(outfit.id)
          }}
          className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 hover:bg-white rounded-full transition-all shadow-md hover:shadow-lg"
        >
          <Heart className={`w-4 h-4 ${outfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
        </button>
      </div>

      {/* Content - Compact Pinterest style */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {outfit.title}
        </h3>
        {outfit.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2" style={{ fontFamily: 'Inter' }}>
            {outfit.description}
          </p>
        )}

        {/* Tags - Show first 2 */}
        <div className="flex flex-wrap gap-1 mb-2">
          {outfit.tags?.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              style={{ fontFamily: 'Inter' }}
            >
              #{tag}
            </span>
          ))}
          {outfit.tags && outfit.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{outfit.tags.length - 2} more
            </span>
          )}
        </div>
        
        {/* Category badge */}
        <span className="inline-block px-2 py-1 bg-[#0B2C21] text-white text-xs rounded font-medium">
          {outfit.category}
        </span>
      </div>
    </div>
  )
}