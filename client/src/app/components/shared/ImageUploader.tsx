'use client'

import { useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'

interface ImageUploaderProps {
  selectedImage: string | null
  onImageSelect: (image: string) => void
  onImageRemove: () => void
  onCameraClick: () => void
  title?: string
  maxSize?: number // in MB
}

export default function ImageUploader({ 
  selectedImage, 
  onImageSelect, 
  onImageRemove, 
  onCameraClick,
  title = "Add Photo",
  maxSize = 5
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Image size must be less than ${maxSize}MB`)
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageSelect(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="mb-6">
      <h4 className="text-lg font-medium text-gray-800 mb-4" style={{ fontFamily: 'Inter' }}>
        {title}
      </h4>
      
      {!selectedImage ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onCameraClick}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Inter' }}>
              Take Photo
            </span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Inter' }}>
              Upload Photo
            </span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-48 h-64 object-cover rounded-lg shadow-md"
            />
            <button
              onClick={onImageRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onCameraClick}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              Take New Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'Inter' }}
            >
              Choose Different Photo
            </button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}