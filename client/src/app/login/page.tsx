'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
 const router = useRouter()
 const { login, loading, error } = useAuth()
 const [username, setUsername] = useState('')
 const [password, setPassword] = useState('')

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   
   try {
     await login({ username, password })
     router.push('/home') 
   } catch (err: any) {
     console.error('Login failed:', err)
     console.error('Error response:', err.response?.data)
     console.error('Error status:', err.response?.status)
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

         {error && (
           <p className="mb-3 text-center text-red-600 font-semibold">{error}</p>
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
             }}>
               {!username && (
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
             }}>
               {!password && (
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
               fontStyle: 'normal',
               fontWeight: 200,
               lineHeight: 'normal',
               letterSpacing: '0.32px'
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
               fontWeight: 'medium',
               cursor: 'pointer',
               marginTop: '6px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               textAlign: 'center',
               paddingLeft: '0px'
             }}
           >
             {loading ? 'Logging in...' : 'Log In'}
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
   </div>
 )
}