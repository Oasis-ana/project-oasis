'use client'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName?: string
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg p-6 w-96 shadow-xl border border-white/20">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
        
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter' }}>
          {message}
          {itemName && (
            <span className="font-semibold text-gray-800"> "{itemName}"</span>
          )}
          ? This action cannot be undone.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            style={{ fontFamily: 'Inter' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            style={{ fontFamily: 'Inter' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}