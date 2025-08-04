'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'

export default function SignupPage() {
  const router = useRouter()
  const { register, loading, error } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  })
  const [passwordError, setPasswordError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear errors when user types
    if (name === 'password' || name === 'password_confirm') {
      setPasswordError('')
    }
  } 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      await register(formData)
      // Seamless redirect - no messages, just go straight to login
      router.push('/login')
    } catch (err: any) {
      console.error('Registration failed:', err)
      // Only show errors if registration actually failed
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EC] flex">
      <div className="w-1/2 bg-[#F5F3EC] flex items-center justify-center p-12">
        <div className="w-full flex flex-col items-center">
          <div className="mb-16">
            <div className="relative inline-block">
              <h1 className="text-7xl font-bold text-[#0B2C21] tracking-wider" style={{
                fontFamily: 'Playfair Display, serif',
                textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
              }}>
                <span className="relative inline-block">
                  O
                  <Image
                    src="/hanger-logo-new.png"
                    alt="Hanger"
                    width={50}
                    height={50}
                    className="absolute transform"
                    style={{
                      top: '65%',
                      left: '43%',
                      transform: 'translateX(-50%) rotate(12deg)'
                    }}
                  />
                </span>ASIS
              </h1>
            </div>
          </div>

          {/* Only show errors - no success messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 rounded-lg max-w-sm">
              <p className="text-center text-red-600 font-semibold text-sm">{error}</p>
            </div>
          )}

          {passwordError && (
            <div className="mb-3 p-3 bg-red-100 border border-red-400 rounded-lg max-w-sm">
              <p className="text-center text-red-600 font-semibold text-sm">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
            <div className="relative">
              <div style={{
                width: '300px',
                height: '50px',
                background: 'rgba(217, 217, 217, 0.40)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                {!formData.username && (
                  <span style={{
                    color: '#000',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 200,
                    lineHeight: 'normal',
                    letterSpacing: '0.32px',
                    position: 'absolute',
                    left: '16px',
                    pointerEvents: 'none'
                  }}>
                    Username <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                  </span>
                )}
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    color: '#000'
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <div style={{
                width: '300px',
                height: '50px',
                background: 'rgba(217, 217, 217, 0.40)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                {!formData.email && (
                  <span style={{
                    color: '#000',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 200,
                    lineHeight: 'normal',
                    letterSpacing: '0.32px',
                    position: 'absolute',
                    left: '16px',
                    pointerEvents: 'none'
                  }}>
                    Email <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                  </span>
                )}
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    color: '#000'
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <div style={{
                width: '300px',
                height: '50px',
                background: 'rgba(217, 217, 217, 0.40)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                {!formData.password && (
                  <span style={{
                    color: '#000',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 200,
                    lineHeight: 'normal',
                    letterSpacing: '0.32px',
                    position: 'absolute',
                    left: '16px',
                    pointerEvents: 'none'
                  }}>
                    Password <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                  </span>
                )}
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    color: '#000'
                  }}
                />
              </div>
            </div>

            <div className="relative">
              <div style={{
                width: '300px',
                height: '50px',
                background: 'rgba(217, 217, 217, 0.40)',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                {!formData.password_confirm && (
                  <span style={{
                    color: '#000',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 200,
                    lineHeight: 'normal',
                    letterSpacing: '0.32px',
                    position: 'absolute',
                    left: '16px',
                    pointerEvents: 'none'
                  }}>
                    Confirm Password <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                  </span>
                )}
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter',
                    color: '#000'
                  }}
                />
              </div>
            </div>

            <div style={{ width: '300px', textAlign: 'left', marginTop: '8px' }}>
              <p style={{
                color: '#000',
                fontFamily: 'Inter',
                fontSize: '12px',
                fontStyle: 'normal',
                fontWeight: 200,
                lineHeight: 'normal',
                letterSpacing: '0.32px'
              }}>
                Have an account? <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:underline font-medium"
                  style={{ fontSize: '12px' }}
                >
                  Log in
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '300px',
                height: '50px',
                background: loading ? '#6B7280' : '#0B2C21',
                color: 'white',
                border: 'none',
                fontSize: '18px',
                fontWeight: 'medium',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Account...
                </div>
              ) : (
                'Register'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="w-1/2 relative">
        <Image
          src="/clothing-collage.png"
          alt="Fashion collage"
          fill
          sizes="50vw"
          quality={100}
          priority
          className="object-cover"
        />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}