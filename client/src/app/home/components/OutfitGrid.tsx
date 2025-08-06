'use client'

import OutfitCard from './OutfitCard'
import { Outfit } from '../../types/outfit'
import { Plus } from 'lucide-react'

interface OutfitGridProps {
  outfits: Outfit[]
  isLoading: boolean
  onOutfitClick: (outfit: Outfit) => void
  onLike: (outfitId: string) => void
  onEdit: (outfit: Outfit) => void
  onDelete: (outfit: Outfit) => void
  onCreateFirst: () => void
  formatTimePosted: (dateString: string) => string
}

export default function OutfitGrid({ 
  outfits, 
  isLoading, 
  onOutfitClick, 
  onLike, 
  onEdit,
  onDelete,
  onCreateFirst, 
  formatTimePosted 
}: OutfitGridProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 lg:py-12">
        <div className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm lg:text-base" style={{ fontFamily: 'Inter' }}>Loading your outfits...</p>
      </div>
    )
  }

  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 mx-2 lg:mx-0">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-700 mb-3 lg:mb-4 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
          No Outfits Found
        </h3>
        <p className="text-gray-500 mb-4 lg:mb-6 text-center text-sm lg:text-base px-4" style={{ fontFamily: 'Inter' }}>
          It looks like you haven't logged any outfits yet.
        </p>
        <button 
          onClick={onCreateFirst}
          className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 active:scale-95 transition-all touch-manipulation min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
            Log Your First Look
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 auto-rows-fr">
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          onLike={onLike}
          onClick={onOutfitClick}
          onEdit={onEdit}
          onDelete={onDelete}
          formatTimePosted={formatTimePosted}
        />
      ))}
    </div>
  )
}