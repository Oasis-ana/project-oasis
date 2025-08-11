'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
 const router = useRouter()
 const { login, loading, error } = useAuth() || { 
    login: async () => {}, 
    loading: false, 
    error: null 
  };
 const [username, setUsername] = useState('')
 const [password, setPassword] = useState('')

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   
   try {
     await login({ username, password })
     router.push('/home') 
   } catch (err: any) {
     console.error('Login failed:', err)
   }
 }

 return (
   <div className="relative min-h-screen bg-[#F5F3EC]">
      
      <div className="absolute inset-0 filter blur-lg lg:hidden">
        <Image 
          src="/clothing-collage.png" 
          alt="Fashion collage background" 
          fill
          sizes="100vw"
          quality={80}
          priority
          className="object-cover"
        />
      </div>
      
      
      <div className="absolute inset-0 bg-[#F5F3EC]/75 lg:hidden"></div>

      
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* Form Section */}
        <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2 lg:p-12">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="mb-10 lg:mb-16">
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

            {error && (
              <div className="mb-3 p-3 bg-red-100 border border-red-400" style={{width: '300px'}}>
                <p className="text-center text-red-600 font-semibold text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 flex flex-col items-center">
              <div className="relative">
                <div style={{
                  width: '300px',
                  height: '50px',
                  background: 'rgba(217, 217, 217, 0.40)',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                  {!username && (
                    <span style={{
                      color: '#000',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontWeight: 200,
                      position: 'absolute',
                      left: '16px',
                      pointerEvents: 'none'
                    }}>
                      Username <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                    </span>
                  )}
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                  {!password && (
                    <span style={{
                      color: '#000',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontWeight: 200,
                      position: 'absolute',
                      left: '16px',
                      pointerEvents: 'none'
                    }}>
                      Password <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span>
                    </span>
                  )}
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      height: '100%',
                      padding: '0 16px',
                      fontSize: '15px',
                      fontFamily: 'Inter',
                      color: '#000'
                    }}
                  />
                </div>
              </div>

              <div style={{ width: '300px', textAlign: 'left', marginTop: '15px' }}>
                <p style={{
                  color: '#000',
                  fontFamily: 'Inter',
                  fontSize: '13px',
                  fontWeight: 200,
                }}>
                  First time? Style starts here. <button
                    type="button"
                    onClick={() => router.push('/signup')}
                    className="text-blue-600 hover:underline font-medium"
                    style={{ fontSize: '12px' }}
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '300px',
                  height: '50px',
                  background: '#0B2C21',
                  color: 'white',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>

        
        <div className="relative hidden w-1/2 lg:block">
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
     </div>
   </div>
 )
}
