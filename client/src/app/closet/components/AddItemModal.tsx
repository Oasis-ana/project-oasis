import { X, Camera, Upload } from 'lucide-react'
import React, { useRef } from 'react'

interface AddItemModalProps {
  isOpen: boolean
  selectedImage: string | null
  itemData: {
    name: string
    brand: string
    size: string
    color: string
    category: string
    tags: string
  }
  isUploading: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  onClose: () => void
  onInputChange: (field: string, value: string) => void
  onTakePhoto: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  onStartCamera: () => void
  onResetSelectedImage: () => void
}

const AddItemModal = ({
  isOpen,
  selectedImage,
  itemData,
  isUploading,
  fileInputRef,
  videoRef,
  canvasRef,
  onClose,
  onInputChange,
  onTakePhoto,
  onFileUpload,
  onSave,
  onStartCamera,
  onResetSelectedImage,
}: AddItemModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
            Add New Item
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!selectedImage ? (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                Add Photo
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onStartCamera}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Take Photo
                  </span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Upload Photo
                  </span>
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="relative flex-shrink-0">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-48 h-64 object-contain rounded-lg shadow-md"
                  />
                  <button
                    onClick={onResetSelectedImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={onStartCamera}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Take New Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Choose Different Photo
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={itemData.name}
                    onChange={(e) => onInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., Black crew-neck sweater"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                    Category
                  </label>
                  <select
                    id="category"
                    value={itemData.category}
                    onChange={(e) => onInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                    Brand (optional)
                  </label>
                  <input
                    type="text"
                    id="brand"
                    value={itemData.brand}
                    onChange={(e) => onInputChange('brand', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., Uniqlo"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                      Size (optional)
                    </label>
                    <input
                      type="text"
                      id="size"
                      value={itemData.size}
                      onChange={(e) => onInputChange('size', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                      placeholder="e.g., M, 32"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                      Color (optional)
                    </label>
                    <input
                      type="text"
                      id="color"
                      value={itemData.color}
                      onChange={(e) => onInputChange('color', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                      placeholder="e.g., Black"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#0B2C21' }}>
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={itemData.tags}
                    onChange={(e) => onInputChange('tags', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., summer, casual, cotton"
                    style={{ fontFamily: 'Inter' }}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Separate tags with commas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0B2C21] rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Playfair Display, serif' }}
            disabled={isUploading || !selectedImage}
          >
            {isUploading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddItemModal