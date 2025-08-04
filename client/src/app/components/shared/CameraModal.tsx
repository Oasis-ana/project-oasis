'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Camera } from 'lucide-react'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onPhotoTaken: (imageData: string) => void
}

export default function CameraModal({ isOpen, onClose, onPhotoTaken }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false)
        }
        
        videoRef.current.onerror = () => {
          setError('Failed to load camera feed')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Unable to access camera. Please check your permissions.')
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera not ready. Please wait a moment and try again.')
      return
    }
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      onPhotoTaken(imageData)
      handleClose()
    } else {
      setError('Failed to process image. Please try again.')
    }
  }

  const handleClose = () => {
    stopCamera()
    setError(null)
    setIsLoading(false)
    onClose()
  }

  const retryCamera = () => {
    setError(null)
    startCamera()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl mx-4">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative bg-black rounded-lg overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Camera Error</h3>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="flex space-x-4">
                <button
                  onClick={retryCamera}
                  className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Starting camera...</p>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '70vh', minHeight: '400px' }}
              />
              
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <button
                  onClick={takePhoto}
                  disabled={isLoading}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Take Photo"
                >
                  <Camera className="w-8 h-8 text-gray-800" />
                </button>
                
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
                  style={{ fontFamily: 'Inter' }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {!error && !isLoading && (
          <div className="mt-4 text-center">
            <p className="text-white text-sm opacity-75" style={{ fontFamily: 'Inter' }}>
              Position your item in the frame and tap the camera button to take a photo
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}