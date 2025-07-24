'use client'

import { useState, useRef } from 'react'

export const useCamera = () => {
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Try other camera if first fails
      try {
        const fallbackMode = facingMode === 'user' ? 'environment' : 'user'
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: fallbackMode }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setShowCamera(true)
        }
      } catch (fallbackError) {
        console.error('Error accessing fallback camera:', fallbackError)
        alert('Unable to access camera. Please try uploading a photo instead.')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const takePhoto = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        stopCamera()
        return imageData
      }
    }
    return null
  }

  return {
    showCamera,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    takePhoto
  }
}