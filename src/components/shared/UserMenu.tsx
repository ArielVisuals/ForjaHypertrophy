import { signOut } from "@/lib/signOut";

interface UserMenuProps {
  user: { displayName: string | null; email: string | null } | null;
  isSignedIn: boolean;
}

export function UserMenu({ user, isSignedIn }: UserMenuProps) {
  if (!isSignedIn) {
    return (
      <a
        href="/login"
        className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all text-sm font-semibold text-white shadow-lg"
      >
        Iniciar Sesión
      </a>
    );
  }

  const name = user?.displayName || "Atleta";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="flex-col items-end hidden sm:flex">
        <span className="text-white font-bold text-sm leading-none">{name}</span>
        <span className="text-white/40 text-[10px] uppercase tracking-widest mt-1">{user?.email}</span>
      </div>

      <div className="w-10 h-10 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center font-black text-blue-200 select-none">
        {initial}
      </div>

      {/* Cerrar sesion directo, sin dropdown */}
      <button
        onClick={signOut}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
