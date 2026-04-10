import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel } from 'lucide-react';

const GavelLoading = ({ text = "The court is in session...", subtext = "Analyzing legal complexities", size = "large" }) => {
  const isLarge = size === "large";

  return (
    <div className={`flex flex-col items-center justify-center ${isLarge ? 'p-12' : 'p-4'} space-y-6`}>
      <div className="relative flex flex-col items-center">
        {/* The Sound Block (Judge's Pad) */}
        <div className="relative mb-2">
          {/* Main Pad Body */}
          <div className={`
            ${isLarge ? 'w-24 h-5' : 'w-16 h-4'} 
            bg-[#2d1a10] rounded-xl border-b-4 border-[#1a0f09] relative z-10 
            animate-block-hit shadow-2xl
          `}>
            {/* Top Surface Polish */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg"></div>
          </div>
          
          {/* Static Depth Shadow */}
          <div className={`${isLarge ? 'w-24 h-2' : 'w-16 h-1.5'} bg-black/20 blur-sm rounded-full -mt-1 mx-auto`}></div>

          {/* Impact Ripple Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
            <div className="w-full h-full bg-lime/20 rounded-full animate-ripple"></div>
          </div>
        </div>
        
        {/* The Gavel - Positioned to hit the pad */}
        <div className="absolute -top-12 right-0 transform translate-x-1/2">
          <div className="relative animate-gavel">
            <Gavel 
              size={isLarge ? 56 : 40} 
              className="text-[#3d2516] transform -scale-x-100 drop-shadow-xl" 
            />
          </div>
        </div>

        {/* Impact Particles */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
           <div className="w-1.5 h-1.5 bg-lime rounded-full animate-ping opacity-75"></div>
           <div className="w-1.5 h-1.5 bg-lime rounded-full animate-ping delay-300 opacity-75"></div>
        </div>
      </div>

      <div className="text-center">
        <motion.p 
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${isLarge ? 'text-lg' : 'text-sm'} font-bold text-forest heading-display lowercase tracking-tight`}
        >
          {text}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.5, 1] }}
          >
            ...
          </motion.span>
        </motion.p>
        {isLarge && subtext && (
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default GavelLoading;
