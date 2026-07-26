import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface ShoppingListItem {
  id: string;
  listId: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  isChecked: boolean;
}

interface ShoppingList {
  id: string;
  type: string;
  createdAt: string;
}

export default function ShoppingListManager() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !list) {
      fetchList();
    }
  }, [isOpen]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shopping-list");
      if (res.ok) {
        const data = await res.json();
        setList(data.list);
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateList = async (timeframe: 'week' | 'month') => {
    setGenerating(true);
    try {
      const res = await fetch("/api/shopping-list/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe }),
      });
      if (res.ok) {
        await fetchList(); // Refetch the newly generated list
      } else {
        const err = await res.json();
        alert(err.error || "Error al generar la lista");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (itemId: string, isChecked: boolean) => {
    // Optimistic update
    setItems(items.map(item => item.id === itemId ? { ...item, isChecked: !isChecked } : item));
    
    try {
      await fetch(`/api/shopping-list/${itemId}/check`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked: !isChecked }),
      });
    } catch (err) {
      console.error(err);
      // Revert if failed
      setItems(items.map(item => item.id === itemId ? { ...item, isChecked } : item));
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-5 rounded-[2rem] bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest text-sm hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 mt-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Lista de Súper con IA
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="w-full max-w-lg max-h-[90vh] bg-[#111] border-t sm:border border-white/15 rounded-t-[2.5rem] sm:rounded-3xl flex flex-col overflow-hidden pb-6 sm:pb-0 shadow-[0_-10px_50px_rgba(0,0,0,0.9)]"
              >
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#161616]">
                  <h2 className="text-lg font-black text-white flex items-center gap-2.5 uppercase tracking-tight">
                    <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    Lista de Súper (IA)
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)} 
                    className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {!list && !loading && !generating && (
                    <div className="py-6 sm:py-8 space-y-6">
                      <div className="text-center space-y-2 px-2">
                        <p className="text-white font-black text-base uppercase tracking-tight">¿Para cuánto tiempo harás el súper?</p>
                        <p className="text-white/50 text-xs leading-relaxed max-w-sm mx-auto">
                          Nuestra IA tomará tu plan activo, calculará las cantidades totales y agrupará por pasillo de supermercado.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-md mx-auto">
                        <button 
                          type="button"
                          onClick={() => generateList('week')} 
                          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 transition-all shadow-lg active:scale-95 group text-center"
                        >
                          <span className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors tracking-tight">1 SEMANA</span>
                          <span className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-wider mt-1.5">Súper de 7 días</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => generateList('month')} 
                          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 transition-all shadow-lg active:scale-95 group text-center"
                        >
                          <span className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors tracking-tight">1 MES</span>
                          <span className="text-[11px] text-blue-400/80 font-bold uppercase tracking-wider mt-1.5">Súper de 30 días</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {generating && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <svg className="animate-spin w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-white/60 text-sm animate-pulse font-bold uppercase tracking-wider">Optimizando lista con IA...</p>
                    </div>
                  )}

                  {list && !generating && (
                    <>
                      <div className="flex justify-between items-center bg-white/[0.03] p-3 rounded-xl border border-white/[0.07]">
                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                          {list.type === 'week' ? '📅 Lista para 1 semana' : '📅 Lista para 1 mes'} 
                        </p>
                        <button 
                          type="button"
                          onClick={() => setList(null)} 
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-widest active:scale-95"
                        >
                          + Generar Otra
                        </button>
                      </div>

                      <div className="space-y-6 mt-4">
                        {Object.entries(groupedItems).map(([category, catItems]) => (
                          <div key={category} className="space-y-2">
                            <h3 className="text-sm font-medium text-white/80 sticky top-0 bg-[#111] py-1 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              {category}
                            </h3>
                            <div className="space-y-1">
                              {catItems.map(item => (
                                <label 
                                  key={item.id} 
                                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                                    item.isChecked 
                                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                                      : 'bg-[#161616] border-white/5 hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <div className="shrink-0">
                                    <input 
                                      type="checkbox" 
                                      className="hidden" 
                                      checked={item.isChecked}
                                      onChange={() => toggleItem(item.id, item.isChecked)}
                                    />
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                                      item.isChecked ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/20 bg-white/[0.02]'
                                    }`}>
                                      {item.isChecked && (
                                        <svg className="w-4 h-4 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`flex-1 transition-all ${item.isChecked ? 'opacity-40 line-through' : 'opacity-100'}`}>
                                    <span className="text-white text-sm sm:text-base font-bold tracking-tight block">{item.name}</span>
                                  </div>
                                  <div className={`shrink-0 text-right ${item.isChecked ? 'opacity-40' : 'opacity-100'}`}>
                                    <span className="text-emerald-400 font-black text-xs sm:text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                      {item.quantity} {item.unit}
                                    </span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
