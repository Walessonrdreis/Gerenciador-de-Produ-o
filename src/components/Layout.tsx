import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Factory, Package, ShoppingCart, Calendar as CalendarIcon, 
  Settings, CheckCircle2, AlertCircle, BarChart3, Layers, Menu, X, ChevronRight 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { useAutoSave } from '../hooks/useAutoSave';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const config = useAppStore(state => state.config);
  const setConfig = useAppStore(state => state.setConfig);
  const { isSaving, error, lastSavedAt, saveNow, clearError } = useAutoSave();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Visão Geral';
      case '/produtos': return 'Produtos';
      case '/materiais': return 'Matéria-Prima';
      case '/pedidos': return 'Pedidos';
      case '/cronograma': return 'Cronograma';
      case '/planejamento': return 'Planejamento';
      case '/setores': return 'Setores';
      default: return 'Visão Geral';
    }
  };

  const navItems = [
    { to: '/', icon: <BarChart3 size={20} />, label: 'Dashboard' },
    { to: '/produtos', icon: <Package size={20} />, label: 'Produtos' },
    // { to: '/materiais', icon: <Layers size={20} />, label: 'Matéria-Prima' },
    // { to: '/pedidos', icon: <ShoppingCart size={20} />, label: 'Pedidos' },
    { to: '/cronograma', icon: <CalendarIcon size={20} />, label: 'Cronograma' },
    { to: '/planejamento', icon: <BarChart3 size={20} />, label: 'Planejamento' },
    { to: '/setores', icon: <Settings size={20} />, label: 'Setores' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1B08] font-sans flex">
      <div className="fixed bottom-4 right-4 z-50 no-print">
        {(isSaving || error || lastSavedAt) && (
          <div className="bg-white border border-[#E8DCC4] shadow-lg rounded-2xl px-4 py-3 flex items-start gap-3 max-w-sm">
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-[#4A2C2A] border-t-transparent rounded-full animate-spin mt-0.5" />
            ) : error ? (
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
            ) : (
              <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4A2C2A]">
                {isSaving ? 'Salvando…' : error ? 'Falha ao salvar' : 'Dados salvos'}
              </p>
              {!error && lastSavedAt && (
                <p className="text-xs text-[#8B5E3C] mt-0.5">Último salvamento: {format(lastSavedAt, 'HH:mm:ss')}</p>
              )}
              {error && (
                <p className="text-xs text-red-600 mt-0.5 break-words">{error}</p>
              )}
              {error && (
                <button
                  onClick={() => saveNow()}
                  className="mt-2 bg-[#4A2C2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#3A2220] transition-colors"
                >
                  Tentar novamente
                </button>
              )}
            </div>
            {error && (
              <button
                onClick={clearError}
                className="p-1 hover:bg-[#F7F0E4] rounded-lg text-[#8B5E3C]"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 no-print md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ x: (isSidebarOpen || window.innerWidth >= 768) ? 0 : -256 }}
        className={cn(
          "fixed md:sticky left-0 top-0 h-screen w-64 bg-white border-r border-[#E8DCC4] p-6 z-50 no-print shadow-2xl md:shadow-none shrink-0 flex flex-col",
          !isSidebarOpen && "hidden md:block"
        )}
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A2C2A] rounded-xl flex items-center justify-center text-white">
              <Factory size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">ChocoPlan</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-[#F7F0E4] rounded-lg text-[#8B5E3C] md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-2 -mr-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-[#4A2C2A] text-white shadow-lg shadow-[#4A2C2A]/20"
                    : "text-[#8B5E3C] hover:bg-[#F7F0E4] hover:text-[#4A2C2A]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 shrink-0">
          <div className="p-4 bg-[#F7F0E4] rounded-2xl border border-[#E8DCC4]">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#8B5E3C] uppercase tracking-wider">
              <Settings size={14} />
              Configuração
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8B5E3C] font-medium block mb-1">Capacidade Diária (Global)</label>
                <input 
                  type="number" 
                  value={config.dailyCapacity}
                  onChange={(e) => setConfig({...config, dailyCapacity: Number(e.target.value)})}
                  className="w-full bg-white border border-[#E8DCC4] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 w-full max-w-full mx-auto overflow-x-hidden">
          <header className="mb-8 flex justify-between items-center no-print">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-white border border-[#E8DCC4] rounded-xl text-[#4A2C2A] hover:bg-[#F7F0E4] transition-colors shadow-sm md:hidden"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">{getPageTitle()}</h2>
                <p className="text-[#8B5E3C] mt-1 text-sm hidden sm:block">Gerencie e otimize sua produção de chocolate.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">Fábrica Central</p>
                <p className="text-xs text-[#8B5E3C]">Status: Operacional</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E8DCC4] flex items-center justify-center">
                <CheckCircle2 size={20} className="text-[#4A2C2A]" />
              </div>
            </div>
          </header>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}