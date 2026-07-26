import React, { useState, useEffect } from "react";
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-full max-w-lg max-h-[85vh] bg-[#111] border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#161616]">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Lista de Súper
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 text-white/50 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!list && !loading && !generating && (
                  <div className="text-center py-10">
                    <p className="text-white/60 mb-6">No tienes ninguna lista generada. Genera una basada en tu plan actual.</p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => generateList('week')} variant="outline" className="border-white/10">1 Semana</Button>
                      <Button onClick={() => generateList('month')} variant="outline" className="border-white/10">1 Mes</Button>
                    </div>
                  </div>
                )}

                {generating && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <svg className="animate-spin w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white/60 text-sm animate-pulse">Optimizando lista con IA...</p>
                  </div>
                )}

                {list && !generating && (
                  <>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-white/40">
                        {list.type === 'week' ? 'Para 1 semana' : 'Para 1 mes'} 
                        • Generada el {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                      <button onClick={() => setList(null)} className="text-xs text-blue-400 hover:text-blue-300">
                        Generar nueva
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
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                  item.isChecked 
                                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                                    : 'bg-[#161616] border-white/5 hover:bg-white/[0.03]'
                                }`}
                              >
                                <div className="mt-0.5">
                                  <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={item.isChecked}
                                    onChange={() => toggleItem(item.id, item.isChecked)}
                                  />
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                    item.isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
                                  }`}>
                                    {item.isChecked && (
                                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <div className={`flex-1 transition-all ${item.isChecked ? 'opacity-40 line-through' : 'opacity-100'}`}>
                                  <span className="text-white text-sm font-medium">{item.name}</span>
                                  <span className="text-white/50 text-sm ml-2">{item.quantity} {item.unit}</span>
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
      </AnimatePresence>
    </>
  );
}
