import { X, Camera, Upload } from 'lucide-react'
import { useRef } from 'react'

interface AddItemModalProps {
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputChange: (field: string, value: string) => void;
  itemData: {
    name: string;
    brand: string;
    size: string;
    color: string;
    category: string;
    tags: string;
  };
  handleSaveItem: () => void;
  isUploading: boolean;
  onClose: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCameraClick: () => void; 
}

export default function AddItemModal({
  selectedImage,
  setSelectedImage,
  handleFileUpload,
  handleInputChange,
  itemData,
  handleSaveItem,
  isUploading,
  onClose,
  fileInputRef,
  onCameraClick, 
}: AddItemModalProps) {
  
  const startCamera = () => {
    if (onCameraClick) {
      onCameraClick();
    } else {
      alert("Camera functionality is not available. Please upload a photo.");
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
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
              <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Add Item Photo
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera} 
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
                onChange={handleFileUpload}
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
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={startCamera} 
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
                  <label htmlFor="name" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={itemData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., White Button-Down Shirt"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    value={itemData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., J.Crew"
                    style={{ fontFamily: 'Inter' }}
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Category
                  </label>
                  <select
                    id="category"
                    value={itemData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] text-gray-900"
                    style={{ fontFamily: 'Inter' }}
                  >
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Size
                    </label>
                    <input
                      type="text"
                      id="size"
                      value={itemData.size}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                      placeholder="e.g., M, 8, 32"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Color
                    </label>
                    <input
                      type="text"
                      id="color"
                      value={itemData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                      placeholder="e.g., White"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-[#0B2C21] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={itemData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2C21] placeholder-gray-700 text-gray-900"
                    placeholder="e.g., casual, linen, summer"
                    style={{ fontFamily: 'Inter' }}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter' }}>
                    Separate tags with commas
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSaveItem}
                  disabled={isUploading || !selectedImage || !itemData.name}
                  className={`px-6 py-3 rounded-full flex items-center space-x-2 font-medium text-sm transition-all ${
                    isUploading || !selectedImage || !itemData.name
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#0B2C21] text-white hover:opacity-90'
                  }`}
                  style={{ fontFamily: 'Inter' }}
                >
                  {isUploading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}