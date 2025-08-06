import { Plus, Shirt, Camera } from 'lucide-react'
import React, { RefObject } from 'react'

interface User {
  username: string
  email: string
  first_name: string
  last_name: string
  bio: string
  avatar?: string
  followers_count?: number
  following_count?: number
}

interface ProfileHeaderProps {
  user: User | null
  triggerFileSelect: () => void
  fileInputRef: RefObject<HTMLInputElement | null> 
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  setShowOutfitCreator: (show: boolean) => void
  setActiveTab: (tab: string) => void
}

export default function ProfileHeader({ 
  user, 
  triggerFileSelect, 
  fileInputRef, 
  handleFileSelect, 
  setShowOutfitCreator, 
  setActiveTab 
}: ProfileHeaderProps) {
  return (
    <div className="text-center px-4 sm:px-6 lg:pl-32 lg:pr-12 mb-6 lg:mb-8">
      {/* Profile Picture - responsive sizing */}
      <div 
        className="w-20 h-20 sm:w-24 sm:h-24 lg:w-24 lg:h-24 rounded-full mx-auto mb-4 overflow-hidden cursor-pointer group relative touch-manipulation"
        onClick={triggerFileSelect}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Profile"
            className="w-full h-full rounded-full object-cover transition-all group-hover:brightness-75"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-orange-400 flex items-center justify-center transition-all group-hover:bg-orange-500">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-16 lg:h-16 rounded-full bg-orange-600"></div>
          </div>
        )}
        
        {/* Upload overlay - improved for mobile */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity rounded-full">
          <Camera className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </div>
        
        {/* Camera icon badge */}
        <div className="absolute -bottom-0.5 -right-0.5 lg:-bottom-1 lg:-right-1 bg-white rounded-full p-1 shadow-lg border-2 border-gray-100">
          <Camera className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-gray-600" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Username - responsive text */}
      <h1 className="text-xl sm:text-2xl lg:text-2xl font-semibold text-gray-800 mb-2 px-2">
        {user?.username?.toUpperCase() || 'USERNAME'}
      </h1>

      {/* Bio - responsive text and spacing */}
      <p className="text-sm sm:text-base lg:text-base text-gray-600 mb-6 px-2 leading-relaxed">
        {user?.bio || 'You write your bio here'}
      </p>

      {/* Action buttons - responsive layout */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
        <button
          onClick={() => setShowOutfitCreator(true)}
          className="bg-[#0B2C21] text-white px-6 py-3 lg:py-3 rounded-full flex items-center justify-center space-x-2 hover:opacity-90 active:scale-95 shadow-md touch-manipulation min-h-[48px] sm:min-h-[auto] transition-transform"
        >
          <Plus className="w-4 h-4 lg:w-4 lg:h-4" />
          <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
            Create Outfit
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('outfits')}
          className="bg-gray-200 text-gray-700 px-6 py-3 lg:py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-gray-300 active:scale-95 active:bg-gray-300 shadow-md touch-manipulation min-h-[48px] sm:min-h-[auto] transition-all"
        >
          <Shirt className="w-4 h-4 lg:w-4 lg:h-4" />
          <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
            My Outfits
          </span>
        </button>
      </div>
    </div>
  )
}