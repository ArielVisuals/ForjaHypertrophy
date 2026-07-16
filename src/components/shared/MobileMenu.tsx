import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/lib/signOut";

interface MobileMenuProps {
  currentPath: string;
  user: { displayName: string | null; email: string | null } | null;
  isSignedIn: boolean;
  isCoach?: boolean;
}

const NAV_COACH = [
  {
    href: "/coach",
    label: "ASESORADOS",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0 .656.126 1.283.356 1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "text-blue-400 bg-blue-500/10",
  },
  {
    href: "/coach/programs",
    label: "BIBLIOTECA",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    accent: "text-blue-400 bg-blue-500/10",
  },
];

const NAV = [
  {
    href: "/dashboard",
    label: "HOME",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/workout",
    label: "FORJAR",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: "text-blue-400 bg-blue-500/10",
  },
  {
    href: "/progress",
    label: "STATS",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/nutrition",
    label: "FUEL",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    accent: "text-orange-400 bg-orange-500/10",
  },
  {
    href: "/program",
    label: "PLAN",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export function MobileMenu({ currentPath, user, isSignedIn, isCoach = false }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  if (!isSignedIn) return null;

  return (
    <>
      {/* ── Bottom bar ── */}
      <nav className="md:hidden fixed bottom-4 left-3 right-3 z-50">
        <div className="bg-black/75 backdrop-blur-xl rounded-[1.75rem] border border-white/10 shadow-2xl p-1.5">
          <div className={`grid gap-0.5 ${isCoach ? "grid-cols-3" : "grid-cols-6"}`}>
            {(isCoach ? NAV_COACH : NAV).map(item => {
              const active = currentPath === item.href;
              const activeClass = active
                ? item.accent ?? "text-white bg-white/10"
                : "text-white/35 hover:text-white/60";
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center rounded-2xl transition-all ${isCoach ? "gap-1.5 py-3.5" : "gap-1 py-2.5"} ${activeClass}`}
                >
                  {isCoach ? <span className="[&>svg]:w-[22px] [&>svg]:h-[22px]">{item.icon}</span> : item.icon}
                  <span className={`font-black uppercase ${isCoach ? "text-[9px] tracking-widest" : "text-[7px] tracking-tight"}`}>{item.label}</span>
                </a>
              );
            })}

            {/* MENU button */}
            <button
              onClick={() => setOpen(true)}
              className={`flex flex-col items-center justify-center rounded-2xl transition-all ${isCoach ? "gap-1.5 py-3.5" : "gap-1 py-2.5"} ${open ? "text-white bg-white/10" : "text-white/35 hover:text-white/60"}`}
            >
              <svg className={isCoach ? "w-[22px] h-[22px]" : "w-[18px] h-[18px]"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5"  r="1.4" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" />
              </svg>
              <span className={`font-black uppercase ${isCoach ? "text-[9px] tracking-widest" : "text-[7px] tracking-tight"}`}>MENÚ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Bottom sheet ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.38 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#0A0A0B] border-t border-x border-white/10 rounded-t-[2.5rem] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]"
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              <div className="px-6 pt-4 pb-10 space-y-5">
                {/* User card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-11 h-11 rounded-full bg-blue-600/25 border border-blue-500/40 flex items-center justify-center font-black text-blue-200 shrink-0">
                    {(user?.displayName || "A").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">
                      {user?.displayName || "Atleta"}
                    </p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Secciones del coach (el sheet del atleta ya las tiene en la barra) */}
                {isCoach && NAV_COACH.map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border transition-all ${
                      currentPath === item.href
                        ? "bg-white/[0.06] border-white/15 text-white"
                        : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                      {item.label.charAt(0) + item.label.slice(1).toLowerCase()}
                    </span>
                    <svg className="w-4 h-4 ml-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}

                {/* Settings link (solo atleta) */}
                {!isCoach && <a
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border transition-all ${
                    currentPath === "/settings"
                      ? "bg-white/[0.06] border-white/15 text-white"
                      : "bg-white/[0.02] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Ajustes</span>
                  <svg className="w-4 h-4 ml-auto opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>}

                {/* Divider */}
                <div className="h-px bg-white/[0.06]" />

                {/* Sign out */}
                  <button onClick={signOut} className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/10 hover:border-red-500/25 transition-all active:scale-[0.98]">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cerrar Sesión</span>
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
