'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LandingPage() {
 const router = useRouter()

 return (
   <div className="min-h-screen relative">
     
     <div className="absolute inset-0">
       <Image
         src="/clothing-collage.png"
         alt="Fashion collage background"
         fill
         sizes="100vw"
         quality={100}
         priority
         className="object-cover"
       />
     </div>

     
     <div className="absolute inset-0" style={{ backgroundColor: 'rgba(245, 243, 236, 0.7)' }}></div>

     
     <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
       
       <div className="mb-8">
         <div className="relative inline-block">
           <h1 className="text-8xl md:text-9xl font-bold text-[#0B2C21] tracking-wider" style={{ 
             fontFamily: 'Playfair Display, serif',
             textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
           }}>
             <span className="relative inline-block">
               O
               <Image
                 src="/hanger-logo-new.png"
                 alt="Hanger"
                 width={70}
                 height={70}
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

       
       <div className="text-center mb-12">
         <p className="text-xl text-[#0B2C21] mb-1" style={{ 
           fontFamily: 'Playfair Display, serif',
           fontWeight: 500,
           letterSpacing: '0.04em'
         }}>
           Your personal style sanctuary
         </p>
         <p className="text-xl text-[#0B2C21] mb-1" style={{ 
           fontFamily: 'Playfair Display, serif',
           fontWeight: 500,
           letterSpacing: '0.04em'
         }}>
           Where fashion meets
         </p>
         <p className="text-xl text-[#0B2C21]" style={{ 
           fontFamily: 'Playfair Display, serif',
           fontWeight: 500,
           letterSpacing: '0.04em'
         }}>
           organization
         </p>
       </div>

      
       <button
         onClick={() => router.push('/login')}
         style={{
           width: '220px',
           height: '60px',
           background: '#0B2C21',
           color: 'white',
           border: 'none',
           borderRadius: '8px',
           fontSize: '18px',
           fontFamily: 'Playfair Display, serif',
           fontWeight: 500,
           fontStyle: 'medium',
           cursor: 'pointer',
           letterSpacing: '0.5px'
         }}
         className="hover:bg-[#0a2419] transition-colors duration-200"
       >
         Discover your style
       </button>
     </div>
   </div>
 )
}
