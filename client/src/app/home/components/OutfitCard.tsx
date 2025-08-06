'use client'

import { useState } from 'react'
import { Heart, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Outfit } from '../../types/outfit'

interface OutfitCardProps {
  outfit: Outfit
  onLike: (outfitId: string) => void
  onClick: (outfit: Outfit) => void
  onEdit: (outfit: Outfit) => void
  onDelete: (outfit: Outfit) => void
  formatTimePosted: (dateString: string) => string
}

export default function OutfitCard({ outfit, onLike, onClick, onEdit, onDelete, formatTimePosted }: OutfitCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)

  // This function now safely handles cases where 'tags' might be a string or an array,
  // preventing the TypeScript error.
  const getTagsArray = () => {
    const tags: any = outfit.tags; // Safely treat tags as 'any' type for this check

    if (Array.isArray(tags)) {
      return tags; // It's already an array, use it directly
    }
    if (typeof tags === 'string' && tags.length > 0) {
      return tags.split(',').map(tag => tag.trim()); // It's a string, so we split it
    }
    return []; // It's empty or in a format we don't recognize
  }
  const tagsArray = getTagsArray();

  const handleMobileMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMobileActions(!showMobileActions)
  }

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] duration-300 relative group touch-manipulation"
      onClick={() => onClick(outfit)}
    >
      
      {/* This container enforces a 3/4 aspect ratio. Padding has been removed to "zoom in" slightly. */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        {/* Loading Skeleton */}
        {!imageLoaded && !imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-[#0B2C21] rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        )}

        {/* Error Placeholder */}
        {imageError && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600"
          >
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📷</div>
              <p className="text-xs font-medium">Image failed to load</p>
            </div>
          </div>
        )}

        {/* The Image - object-contain ensures the entire image is visible */}
        <img
          src={outfit.image}
          alt={outfit.title}
          className={`w-full h-full object-contain object-center transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
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

        {/* Overlays - Time and Like button */}
        {imageLoaded && (
          <>
            <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-medium">
              {formatTimePosted(outfit.created_at)}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike(outfit.id)
              }}
              className="absolute top-2 lg:top-3 right-2 lg:right-3 p-2 bg-white bg-opacity-90 hover:bg-white active:bg-white rounded-full transition-all shadow-md hover:shadow-lg touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${outfit.liked ? 'text-red-500 fill-current' : 'text-gray-600 hover:text-red-500'}`} />
            </button>

            {/* Mobile Actions Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-white active:bg-white rounded-full transition-all shadow-md touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center lg:hidden"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {/* Mobile Actions Menu */}
            {showMobileActions && (
              <div className="absolute bottom-12 right-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 lg:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(outfit)
                    setShowMobileActions(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-100 w-full text-left touch-manipulation"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(outfit)
                    setShowMobileActions(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 active:bg-gray-100 w-full text-left touch-manipulation"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}

            {/* Overlay to close mobile menu when clicking elsewhere */}
            {showMobileActions && (
              <div
                className="fixed inset-0 z-10 lg:hidden"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMobileActions(false)
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Content Below Image - mobile optimized */}
      <div className="p-3 lg:p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 text-sm lg:text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
          {outfit.title}
        </h3>
        
        {outfit.description && (
          <p className="text-xs lg:text-sm text-gray-600 mb-2 line-clamp-2" style={{ fontFamily: 'Inter' }}>
            {outfit.description}
          </p>
        )}
        
        {/* Tags - mobile responsive */}
        <div className="flex flex-wrap gap-1 mb-2">
          {tagsArray.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              style={{ fontFamily: 'Inter' }}
            >
              #{tag}
            </span>
          ))}
          {tagsArray.length > 2 && (
            <span className="text-xs text-gray-500">
              +{tagsArray.length - 2} more
            </span>
          )}
        </div>
        
        <span className="inline-block px-2 py-1 bg-[#0B2C21] text-white text-xs rounded font-medium">
          {outfit.category}
        </span>
      </div>

      {/* Desktop Hover Actions - Edit and Delete (Hidden on mobile) */}
      {imageLoaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:flex">
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