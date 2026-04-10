import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getState } from '../api/stateApi';

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrateState = useAppStore(state => state.hydrateState);

  useEffect(() => {
    let isMounted = true;
    getState()
      .then((data) => {
        if (!isMounted) return;
        hydrateState(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setError(err.message || 'Erro crítico ao inicializar o aplicativo.');
        setIsLoading(false);
      });
    
    return () => { isMounted = false; };
  }, [hydrateState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-[#4A2C2A] font-sans">
        <div className="w-12 h-12 border-4 border-[#4A2C2A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-lg tracking-tight">Carregando fábrica...</p>
        <p className="text-sm text-[#8B5E3C] mt-2">Sincronizando dados do servidor</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-6 font-sans">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#4A2C2A] mb-2">Falha na Sincronização</h2>
        <p className="text-[#8B5E3C] max-w-md mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#4A2C2A] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
}