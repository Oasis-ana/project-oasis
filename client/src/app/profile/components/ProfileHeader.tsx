// components/profile/ProfileHeader.tsx

import { Plus, Shirt, Camera } from 'lucide-react'
import React, { RefObject } from 'react' // Import RefObject

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
  // CHANGE THIS LINE: Allow HTMLInputElement OR null
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
    <div className="text-center pl-32 pr-12 mb-8">
      <div 
        className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden cursor-pointer group relative"
        onClick={triggerFileSelect}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover transition-all group-hover:brightness-75"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-orange-400 flex items-center justify-center transition-all group-hover:bg-orange-500">
            <div className="w-16 h-16 rounded-full bg-orange-600"></div>
          </div>
        )}
        
        {/* Simplified upload state for this component, actual upload logic remains in parent */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Camera className="w-6 h-6 text-white" />
        </div>
        
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg border-2 border-gray-100">
          <Camera className="w-3 h-3 text-gray-600" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        {user?.username?.toUpperCase() || 'USERNAME'}
      </h1>

      <p className="text-gray-600 mb-6">
        {user?.bio || 'You write your bio here'}
      </p>

      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setShowOutfitCreator(true)}
          className="bg-[#0B2C21] text-white px-6 py-3 rounded-full flex items-center space-x-2 hover:opacity-90 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
            Create Outfit
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('outfits')}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-full flex items-center space-x-2 hover:bg-gray-300 shadow-md"
        >
          <Shirt className="w-4 h-4" />
          <span style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500' }}>
            My Outfits
          </span>
        </button>
      </div>
    </div>
  )
}