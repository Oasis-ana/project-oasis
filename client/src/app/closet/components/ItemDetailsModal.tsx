import { X, Trash2, Edit, Check, Plus, Shirt, Package, Crown, ShirtIcon, Star, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ClothingItem {
  id: string
  name: string
  brand: string
  size: string
  color: string
  category: string
  image: string
  tags: string[]
  isFavorite: boolean
  isWorn: boolean
  lastWorn?: string
  createdAt: string
}

interface ItemDetailsModalProps {
  item: ClothingItem
  onClose: () => void
  onToggleWear: (item: ClothingItem) => void
  onUpdateItem: (item: ClothingItem) => void
  onDelete: () => void
}

export default function ItemDetailsModal({ item, onClose, onToggleWear, onUpdateItem, onDelete }: ItemDetailsModalProps) {
  const [itemData, setItemData] = useState(item)
  const [isEditing, setIsEditing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [imageError, setImageError] = useState(false)

  
  useEffect(() => {
    setItemData(item);
    setImageError(false);
  }, [item]);

  
  const isUrlImage = (imageUrl: string) => {
    if (!imageUrl) return false
    const isMediaStorageImage = 
      imageUrl.includes('.amazonaws.com') ||
      imageUrl.includes('cloudfront.net') ||
      imageUrl.startsWith('/media/') ||
      imageUrl.includes('storage.googleapis') ||
      imageUrl.includes('localhost:8000') ||
      !imageUrl.startsWith('http')
    
    return imageUrl.startsWith('http') && !isMediaStorageImage
  }

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-32 h-32 text-gray-300"
    switch (category) {
      case 'Tops':
        return <Shirt className={iconClass} />
      case 'Bottoms':
        return <Package className={iconClass} />
      case 'Dresses':
        return <Crown className={iconClass} />
      case 'Outerwear':
        return <ShirtIcon className={iconClass} />
      case 'Shoes':
        return <Star className={iconClass} />
      case 'Accessories':
        return <Zap className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  const handleInputChange = (field: keyof ClothingItem, value: string) => {
    setItemData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !itemData.tags.includes(trimmedTag)) {
      setItemData(prevData => ({
        ...prevData,
        tags: [...prevData.tags, trimmedTag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setItemData(prevData => ({
      ...prevData,
      tags: prevData.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveEdit = () => {
    onUpdateItem(itemData);
    setIsEditing(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-xl flex relative">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-1/2 p-8 overflow-y-auto">
          {itemData.image && !imageError ? (
            <img
              src={itemData.image}
              alt={itemData.name}
              className="w-full h-auto object-cover rounded-lg"
              onError={handleImageError}
              crossOrigin={isUrlImage(itemData.image) ? "anonymous" : undefined}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-80 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="w-24 h-24 text-gray-300">
                {getCategoryIcon(itemData.category)}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => onToggleWear(itemData)}
              className={`py-3 px-6 rounded-lg text-sm font-medium transition-colors ${
                itemData.isWorn ? 'bg-[#2A5F4F] text-white hover:bg-[#0B2C21]' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {itemData.isWorn ? 'Worn' : 'Not Worn'}
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onDelete}
                className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 p-8 overflow-y-auto bg-gray-50">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            {isEditing ? (
              <input
                type="text"
                value={itemData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full font-semibold text-gray-900 text-2xl border-0 border-b-2 border-gray-200 focus:outline-none focus:border-gray-900 bg-transparent pb-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            ) : (
              <span>{itemData.name}</span>
            )}
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Category
              </label>
              {isEditing ? (
                <select
                  value={itemData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="Tops">Tops</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Dresses">Dresses</option>
                  <option value="Outerwear">Outerwear</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Accessories">Accessories</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {itemData.category}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Brand
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={itemData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              ) : (
                <p className="text-sm text-gray-900 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {itemData.brand}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Size
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={itemData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {itemData.size}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Color
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={itemData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {itemData.color}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {itemData.tags.map((tag, index) => (
                  <div key={index} className="flex items-center bg-white text-gray-700 px-3 py-2 rounded-lg text-sm border border-gray-200">
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>{tag}</span>
                    {isEditing && (
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag..."
                      className="w-24 text-sm focus:outline-none text-gray-900 bg-transparent"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                    <button 
                      onClick={handleAddTag}
                      className="ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSaveEdit}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}