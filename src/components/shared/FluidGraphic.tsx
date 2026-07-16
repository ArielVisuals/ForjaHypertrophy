import React from 'react';
import { motion } from 'framer-motion';

export const FluidGraphic = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Background Fluid Blobs (Refracted by Glass) */}
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full opacity-60 scale-150"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="blurFilter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          </filter>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="g2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          animate={{
            d: [
              "M200,100 C250,100 300,150 300,200 C300,250 250,300 200,300 C150,300 100,250 100,200 C100,150 150,100 200,100 Z",
              "M200,120 C270,100 320,160 310,230 C300,300 240,320 180,310 C120,300 100,240 110,170 C120,100 150,130 200,120 Z",
              "M200,100 C250,100 300,150 300,200 C300,250 250,300 200,300 C150,300 100,250 100,200 C100,150 150,100 200,100 Z"
            ],
            rotate: [0, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          fill="url(#g1)"
          filter="url(#blurFilter)"
        />

        <motion.path
          animate={{
            d: [
              "M200,150 C240,150 280,180 280,220 C280,260 240,290 200,290 C160,290 120,260 120,220 C120,180 160,150 200,150 Z",
              "M210,130 C280,140 300,210 280,270 C260,330 190,320 130,280 C70,240 90,160 140,140 C190,120 210,130 210,130 Z",
              "M200,150 C240,150 280,180 280,220 C280,260 240,290 200,290 C160,290 120,260 120,220 C120,180 160,150 200,150 Z"
            ],
            rotate: [360, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          fill="url(#g2)"
          filter="url(#blurFilter)"
        />
      </svg>

      {/* Main Glass Lens */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-[min(80%,380px)] aspect-square rounded-[3rem] border border-white/20 bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] overflow-hidden group"
      >
        {/* Reflection Highlight */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Internal Content (Isotipo) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150" />
            <img
              src="/isotipo-512.webp"
              alt="FORJA Isotipo"
              width="512"
              height="512"
              className="relative w-[clamp(100px,40%,160px)] h-auto brightness-125 transition-all duration-700 group-hover:scale-110 group-hover:brightness-150"
            />
          </motion.div>
        </div>

        {/* Dynamic Glass Shine */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
            y: ['-100%', '200%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 2
          }}
          className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
        />
      </motion.div>

      {/* Technical Orbital Ring (Outside Glass) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute w-[min(95%,500px)] aspect-square rounded-full border border-white/5 pointer-events-none"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500/50" />
      </motion.div>
    </div>
  );
};
