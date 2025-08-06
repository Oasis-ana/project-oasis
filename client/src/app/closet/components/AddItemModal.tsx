import { X, Camera, Upload } from 'lucide-react'

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
    onCameraClick();
  }

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error('File input ref is null')
    }
  }

  return (
    // RESPONSIVE CHANGE: Added padding for small screens (p-4)
    <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
      {/* RESPONSIVE CHANGE: Modal width is now responsive, taking full width on small screens. */}
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-white/20">
        {/* RESPONSIVE CHANGE: Padding adjusted for smaller screens. */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-[#0B2C21]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Add New Item
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* RESPONSIVE CHANGE: Padding adjusted for smaller screens. */}
        <div className="p-4 sm:p-6">
          {!selectedImage ? (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-[#0B2C21] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Add Item Photo
              </h4>
               {/* RESPONSIVE CHANGE: Grid stacks to one column on small screens. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={startCamera} 
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Take Photo
                  </span>
                </button>
                
                <button
                  onClick={triggerUpload}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0B2C21] hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Upload Photo
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               {/* RESPONSIVE CHANGE: Layout stacks vertically on small screens. */}
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative flex-shrink-0 w-full sm:w-48">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    // RESPONSIVE CHANGE: Image takes full width on small screens and has a fixed height.
                    className="w-full h-64 sm:h-64 sm:w-48 object-contain rounded-lg shadow-md bg-gray-100"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* RESPONSIVE CHANGE: Buttons are now in a row on small screens. */}
                <div className="flex flex-row sm:flex-col w-full sm:w-auto space-x-2 sm:space-x-0 sm:space-y-3">
                  <button
                    onClick={startCamera} 
                    className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={triggerUpload}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Upload New
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

                {/* RESPONSIVE CHANGE: Grid stacks to one column on small screens. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              
              {/* RESPONSIVE CHANGE: Button takes full width on small screens. */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSaveItem}
                  disabled={isUploading || !selectedImage || !itemData.name}
                  className={`w-full sm:w-auto px-6 py-3 rounded-full flex items-center justify-center space-x-2 font-medium text-sm transition-all ${
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