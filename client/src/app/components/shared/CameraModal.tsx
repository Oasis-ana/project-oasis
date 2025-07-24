'use client'

import { RefObject } from 'react'
import { X, Camera } from 'lucide-react'

interface CameraModalProps {
  isOpen: boolean
  videoRef: RefObject<HTMLVideoElement>
  canvasRef: RefObject<HTMLCanvasElement> // Added back the canvas ref
  onTakePhoto: () => void
  onClose: () => void
  tip?: string
}

export default function CameraModal({ 
  isOpen, 
  videoRef,
  canvasRef, // Added back the canvas ref
  onTakePhoto, 
  onClose, 
  tip = "💡 Good lighting makes great photos!" 
}: CameraModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60">
      <div className="relative w-full max-w-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg"
        />
        
        {/* Hidden canvas element for capturing the image */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={onTakePhoto}
            className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            style={{ fontFamily: 'Inter' }}
          >
            📸 Take Photo
          </button>
          <button
            onClick={onClose}
            className="bg-gray-800 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700 transition-colors"
            style={{ fontFamily: 'Inter' }}
          >
            Cancel
          </button>
        </div>
        
        {/* Camera tip */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
            {tip}
          </div>
        </div>
      </div>
    </div>
  )
}