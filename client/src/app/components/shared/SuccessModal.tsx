'use client'

import { Check } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose?: () => void
}

export default function SuccessModal({ isOpen, title, message, onClose }: SuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20 text-center max-w-sm mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h3>
        <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>
          {message}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-[#0B2C21] text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Inter' }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}