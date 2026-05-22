import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton, SignUpButton, SignOutButton } from "@clerk/astro/react";

interface LandingHeaderProps {
  user: any;
  isSignedIn: boolean;
}

export const LandingHeader = ({ user, isSignedIn }: LandingHeaderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExpanded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="fixed top-[clamp(1rem,4vw,2rem)] left-0 right-0 z-50 px-6">
      <div className="max-w-7xl mx-auto flex justify-center">
        <motion.div
          layout
          initial={{ width: "70px", height: "64px" }}
          animate={{ width: isExpanded ? "100%" : "70px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-full border border-white/10 backdrop-blur-md bg-white/[0.03] shadow-2xl overflow-hidden"
        >
          <div className={`flex items-center h-full px-[clamp(1.5rem,4vw,2.5rem)] ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            <motion.div layout className="flex items-center gap-3 shrink-0">
              <a href="/" className="flex items-center gap-3 min-h-[44px]">
                <img src="/isotipo.png" alt="FORJA" className="h-[clamp(1.75rem,4vw,2.25rem)] w-auto" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[clamp(1rem,2vw,1.25rem)] font-extrabold text-white tracking-tighter">FORJA</motion.span>
                  )}
                </AnimatePresence>
              </a>
            </motion.div>

            <AnimatePresence>
              {isExpanded && (
                <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-[clamp(1.5rem,3vw,3rem)]">
                    <a href="#features" className="text-white/50 hover:text-white text-[clamp(0.65rem,1.2vw,0.75rem)] font-bold uppercase tracking-[0.2em]">Características</a>
                    <a href="#pricing" className="text-white/50 hover:text-white text-[clamp(0.65rem,1.2vw,0.75rem)] font-bold uppercase tracking-[0.2em]">Precios</a>
                    <a href="#about" className="text-white/50 hover:text-white text-[clamp(0.65rem,1.2vw,0.75rem)] font-bold uppercase tracking-[0.2em]">Acerca</a>
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isExpanded && (
                <div className="flex items-center gap-[clamp(1rem,2vw,2rem)]">
                  {!isSignedIn ? (
                    <>
                      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                        <button className="hidden sm:block text-[clamp(0.65rem,1.2vw,0.75rem)] font-bold text-white/40 hover:text-white uppercase tracking-widest cursor-pointer">
                          Login
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                        <button className="group flex items-center gap-3 pl-[clamp(1rem,3vw,1.5rem)] pr-2 py-2 rounded-full bg-white/[0.08] hover:bg-blue-500/20 backdrop-blur-xl border border-white/10 text-white transition-all cursor-pointer">
                          <span className="text-[clamp(0.65rem,1.2vw,0.75rem)] font-black uppercase tracking-widest">Comenzar</span>
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-lg">
                            <svg className="w-4 h-4 text-black group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                          </div>
                        </button>
                      </SignUpButton>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <a href="/dashboard" className="text-white/40 hover:text-white font-bold uppercase tracking-widest text-[clamp(0.65rem,1.2vw,0.75rem)]">Dashboard</a>
                      <SignOutButton redirectUrl="/">
                        <button className="text-red-400/60 hover:text-red-400 font-bold uppercase tracking-widest text-[clamp(0.65rem,1.2vw,0.75rem)] cursor-pointer">
                          Logout
                        </button>
                      </SignOutButton>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
