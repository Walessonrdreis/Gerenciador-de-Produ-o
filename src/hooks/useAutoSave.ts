import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { saveState } from '../api/stateApi';

export function useAutoSave(debounceMs: number = 800) {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);
  const sectors = useAppStore(state => state.sectors);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstRender = useRef(true);

  const saveNow = async () => {
    setIsSaving(true);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const payload = { products, materials, orders, config, sectors };
    try {
      await saveState(payload, controller.signal);
      setLastSavedAt(new Date());
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Falha ao salvar.');
    } finally {
      if (!controller.signal.aborted) {
        setIsSaving(false);
      }
    }
  };

  // Auto Save Effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const timeout = setTimeout(() => {
      saveNow();
    }, debounceMs);
    
    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, materials, orders, config, sectors, debounceMs]);

  return {
    isSaving,
    error,
    lastSavedAt,
    saveNow,
    clearError: () => setError(null)
  };
}