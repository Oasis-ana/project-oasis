'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'


const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>

export default function SignupPage() {
  const router = useRouter()
  
  const { register, loading, error, setError } = useAuth() || { 
    register: async () => {}, 
    loading: false, 
    error: null, 
    setError: (message: string | null) => {} 
  };
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  })

  
  const [passwordValidity, setPasswordValidity] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  })

  
  useEffect(() => {
    const { password } = formData
    setPasswordValidity({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }, [formData.password])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    if (error) setError(null)
  } 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) 

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match')
      return
    }

    
    const allValid = Object.values(passwordValidity).every(Boolean)
    if (!allValid) {
      setError("Password does not meet all requirements.")
      return
    }

    try {
      await register(formData)
      
      router.push('/home')
    } catch (err: any) {
      console.error('Registration failed:', err)
      
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
            
            <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
              {/* Username Field */}
              <div className="relative">
                <div style={{ width: '300px', height: '50px', background: 'rgba(217, 217, 217, 0.40)', display: 'flex', alignItems: 'center', position: 'relative' }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                  {!formData.username && (<span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontWeight: 200, position: 'absolute', left: '16px', pointerEvents: 'none' }}>Username <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span></span>)}
                  <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', height: '100%', padding: '0 16px', fontSize: '16px', fontFamily: 'Inter', color: '#000' }} />
                </div>
              </div>
              
              
              <div className="relative">
                <div style={{ width: '300px', height: '50px', background: 'rgba(217, 217, 217, 0.40)', display: 'flex', alignItems: 'center', position: 'relative' }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                  {!formData.email && (<span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontWeight: 200, position: 'absolute', left: '16px', pointerEvents: 'none' }}>Email <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span></span>)}
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', height: '100%', padding: '0 16px', fontSize: '16px', fontFamily: 'Inter', color: '#000' }} />
                </div>
              </div>

              
              <div className="w-[300px] space-y-2">
                <div className="relative">
                  <div style={{ width: '100%', height: '50px', background: 'rgba(217, 217, 217, 0.40)', display: 'flex', alignItems: 'center', position: 'relative' }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                    {!formData.password && (<span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontWeight: 200, position: 'absolute', left: '16px', pointerEvents: 'none' }}>Password <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span></span>)}
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', height: '100%', padding: '0 16px', fontSize: '16px', fontFamily: 'Inter', color: '#000' }} />
                  </div>
                </div>
                {formData.password && (
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                      <li className="flex items-center">{passwordValidity.minLength ? <CheckIcon/> : <CrossIcon/>} <span className="ml-2">8+ characters</span></li>
                      <li className="flex items-center">{passwordValidity.uppercase ? <CheckIcon/> : <CrossIcon/>} <span className="ml-2">1 uppercase</span></li>
                      <li className="flex items-center">{passwordValidity.lowercase ? <CheckIcon/> : <CrossIcon/>} <span className="ml-2">1 lowercase</span></li>
                      <li className="flex items-center">{passwordValidity.number ? <CheckIcon/> : <CrossIcon/>} <span className="ml-2">1 number</span></li>
                      <li className="flex items-center col-span-2">{passwordValidity.specialChar ? <CheckIcon/> : <CrossIcon/>} <span className="ml-2">1 special character</span></li>
                    </ul>
                  </div>
                )}
              </div>

              
              <div className="relative">
                <div style={{ width: '300px', height: '50px', background: 'rgba(217, 217, 217, 0.40)', display: 'flex', alignItems: 'center', position: 'relative' }} className="ring-1 ring-[#0B2C21]/70 lg:ring-0">
                  {!formData.password_confirm && (<span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontWeight: 200, position: 'absolute', left: '16px', pointerEvents: 'none' }}>Confirm Password <span style={{ color: '#FF0606', fontWeight: 700 }}>*</span></span>)}
                  <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', height: '100%', padding: '0 16px', fontSize: '16px', fontFamily: 'Inter', color: '#000' }} />
                </div>
              </div>

              <div style={{ width: '300px', textAlign: 'left', marginTop: '8px' }}>
                <p style={{ color: '#000', fontFamily: 'Inter', fontSize: '13px', fontWeight: 200 }}>
                  Have an account? <button type="button" onClick={() => router.push('/login')} className="text-blue-600 hover:underline font-medium" style={{ fontSize: '12px' }}>Log in</button>
                </p>
              </div>

              <button type="submit" disabled={loading} style={{ width: '300px', height: '50px', background: loading ? '#6B7280' : '#0B2C21', color: 'white', border: 'none', fontSize: '18px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>

        
        <div className="relative hidden w-1/2 lg:block">
          <Image src="/clothing-collage.png" alt="Fashion collage" fill sizes="50vw" quality={100} priority className="object-cover" />
        </div>
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
