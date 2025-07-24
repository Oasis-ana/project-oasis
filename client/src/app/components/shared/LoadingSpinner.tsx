'use client'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className="text-center py-8">
      <div className={`${sizeClasses[size]} border-4 border-[#0B2C21] border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
      <p className="text-gray-600" style={{ fontFamily: 'Inter' }}>{message}</p>
    </div>
  )
}