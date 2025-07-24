'use client'

import { useState } from 'react'
import { Heart, Edit, Trash2 } from 'lucide-react'
import { Outfit } from '../../types/outfit' // <-- Import the correct Outfit interface

// REMOVED the local Outfit interface to avoid type conflicts

interface OutfitCardProps {
  outfit: Outfit
  onLike: (outfitId: string) => void
  onClick: (outfit: Outfit) => void
  onEdit: (outfit: Outfit) => void // <-- Add this prop
  onDelete: (outfit: Outfit) => void // <-- Add this prop
  formatTimePosted: (dateString: string) => string
}

export default function OutfitCard({ outfit, onLike, onClick, onEdit, onDelete, formatTimePosted }: OutfitCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] duration-300 relative group"
      onClick={() => onClick(outfit)}
    >
      {/* Image with time badge and action buttons */}
      <div className="relative bg-gray-100">
        {!imageLoaded && !imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
            style={{ height: '320px', aspectRatio: '3/4' }}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[#0B2C21] rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        )}

        {imageError && (
          <div 
            className="flex items-center justify-center bg-gray-200 text-gray-600"
            style={{ height: '320px', aspectRatio: '3/4' }}
          >
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📷</div>
              <p className="text-xs font-medium">Image failed to load</p>
            </div>
          </div>
        )}

        <img
          src={outfit.image}
          alt={outfit.title}
          className={`w-full h-80 object-cover object-center transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ aspectRatio: '3/4' }}
          onLoad={() => {
            setImageLoaded(true)
            setImageError(false)
          }}
          onError={() => {
            setImageError(true)
            setImageLoaded(false)
          }}
          loading="lazy"
          decoding="async"
        />

        {imageLoaded && (
          <>
            <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
              {formatTimePosted(outfit.created_at)}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike(outfit.id)
              }}
              className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 hover:bg-white rounded-full transition-all shadow-md hover:shadow-lg"
            >
              <Heart className={`w-4 h-4 ${outfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {outfit.title}
        </h3>
        
        {outfit.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2" style={{ fontFamily: 'Inter' }}>
            {outfit.description}
          </p>
        )}
        
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
        
        <span className="inline-block px-2 py-1 bg-[#0B2C21] text-white text-xs rounded font-medium">
          {outfit.category}
        </span>
      </div>

      {/* Edit and Delete buttons on hover */}
      {imageLoaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(outfit)
            }}
            className="p-3 bg-white bg-opacity-70 rounded-full text-gray-800 hover:bg-opacity-100 transition-colors shadow-md"
            title="Edit Outfit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(outfit)
            }}
            className="p-3 bg-white bg-opacity-70 rounded-full text-red-600 hover:bg-opacity-100 transition-colors shadow-md"
            title="Delete Outfit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}