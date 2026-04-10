import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const safeJsonParse = (text: string): any | null => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
};

const fetchJson = async (url: string, init: RequestInit) => {
  const res = await fetch(url, init);
  const text = await res.text();
  const json = safeJsonParse(text);
  return { ok: res.ok, status: res.status, json, text };
};

export function useAutoSave() {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);
  
  const setProducts = useAppStore(state => state.setProducts);
  const setMaterials = useAppStore(state => state.setMaterials);
  const setOrders = useAppStore(state => state.setOrders);
  const setConfig = useAppStore(state => state.setConfig);

  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveNow = async (signal?: AbortSignal) => {
    setSaveStatus('saving');
    setSaveMessage(null);
    const payload = { products, materials, orders, config };
    try {
      const { ok, status, json, text } = await fetchJson('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });
      if (!ok) {
        const message = json?.error || json?.message || text || `HTTP ${status}`;
        setSaveStatus('error');
        setSaveMessage(typeof message === 'string' ? message : `Erro ao salvar (HTTP ${status}).`);
        return;
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      setSaveStatus('error');
      setSaveMessage(error?.message || 'Falha ao salvar.');
    }
  };

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    setSaveStatus('idle');
    setSaveMessage(null);
    
    fetchJson('/api/state', { method: 'GET' })
      .then(({ ok, status, json, text }) => {
        if (!isMounted) return;
        if (!ok) {
          setSaveStatus('error');
          const message = json?.error || json?.message || text || `HTTP ${status}`;
          setSaveMessage(typeof message === 'string' ? message : `Erro ao carregar (HTTP ${status}).`);
          setIsStateLoaded(true);
          return;
        }
        const data = json?.data;
        if (data?.products) setProducts(data.products);
        if (data?.materials) setMaterials(data.materials);
        if (data?.orders) setOrders(data.orders);
        if (data?.config) setConfig(data.config);
        setIsStateLoaded(true);
      })
      .catch((error) => {
        if (!isMounted) return;
        setSaveStatus('error');
        setSaveMessage(error?.message || 'Falha ao carregar.');
        setIsStateLoaded(true);
      });
      
    return () => { isMounted = false; };
  }, [setProducts, setMaterials, setOrders, setConfig]);

  // Auto Save Effect
  useEffect(() => {
    if (!isStateLoaded) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      saveNow(controller.signal);
    }, 800);
    
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [products, materials, orders, config, isStateLoaded]);

  return {
    saveStatus,
    saveMessage,
    lastSavedAt,
    saveNow,
    setSaveStatus,
    isStateLoaded
  };
}