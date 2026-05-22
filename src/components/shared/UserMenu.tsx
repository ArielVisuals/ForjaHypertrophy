import React from 'react';
import { SignOutButton, SignInButton } from "@clerk/astro/react";

interface UserMenuProps {
  user: any;
  isSignedIn: boolean;
}

export function UserMenu({ user, isSignedIn }: UserMenuProps) {
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all text-sm font-semibold text-white shadow-lg">
          Iniciar Sesión
        </button>
      </SignInButton>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end hidden sm:flex">
        <span className="text-white font-bold text-sm leading-none">
          {user?.firstName || user?.username || 'Atleta'}
        </span>
        <span className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
          {user?.primaryEmailAddress?.emailAddress}
        </span>
      </div>
      
      <div className="group relative">
        <img 
          src={user?.imageUrl} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full border border-white/20 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all"
        />
        
        {/* Dropdown Menu - Mejorado para sobresalir */}
        <div className="absolute right-0 top-[120%] w-56 py-3 bg-[#0A0A0B]/90 backdrop-blur-2xl border border-white/20 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] translate-y-2 group-hover:translate-y-0">
          <div className="px-5 py-3 border-b border-white/10 sm:hidden">
             <p className="text-white font-black text-sm truncate">{user?.firstName || user?.username}</p>
             <p className="text-white/40 text-[10px] uppercase tracking-widest truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          
          <div className="px-2 pt-1">
            <SignOutButton redirectUrl="/">
              <button className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-black uppercase tracking-widest flex items-center gap-3 active:scale-95">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4-4H3" />
                  </svg>
                </div>
                Cerrar Sesión
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
