import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Product, RawMaterial, ProductionOrder, FactoryConfig, ScheduledDay } from '../types';
import { planProduction } from '../lib/planner';

interface FactoryContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  materials: RawMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<RawMaterial[]>>;
  orders: ProductionOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>;
  config: FactoryConfig;
  setConfig: React.Dispatch<React.SetStateAction<FactoryConfig>>;
  schedule: ScheduledDay[];
  addOrder: (productId: string, quantity: number, date: string) => void;
  removeOrder: (id: string) => void;
  updateMaterialStock: (id: string, newStock: number) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveMessage: string | null;
  lastSavedAt: Date | null;
  saveNow: () => void;
  setSaveStatus: React.Dispatch<React.SetStateAction<'idle' | 'saving' | 'saved' | 'error'>>;
}

export const FactoryContext = createContext<FactoryContextType | null>(null);

const INITIAL_MATERIALS: RawMaterial[] = [
  { id: '1', name: 'Cacau em Pó', unit: 'kg', stock: 500 },
  { id: '2', name: 'Açúcar', unit: 'kg', stock: 300 },
  { id: '3', name: 'Leite em Pó', unit: 'kg', stock: 200 },
  { id: '4', name: 'Manteiga de Cacau', unit: 'kg', stock: 150 },
];

const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Chocolate Amargo 70%', 
    capacityCost: 1, 
    materials: [
      { materialId: '1', amount: 0.7 },
      { materialId: '4', amount: 0.3 }
    ] 
  },
  { 
    id: '2', 
    name: 'Chocolate ao Leite', 
    capacityCost: 0.8, 
    materials: [
      { materialId: '1', amount: 0.3 },
      { materialId: '2', amount: 0.4 },
      { materialId: '3', amount: 0.3 }
    ] 
  },
];

const INITIAL_CONFIG: FactoryConfig = {
  dailyCapacity: 100,
  workDays: [1, 2, 3, 4, 5],
  holidays: ['2026-04-21', '2026-05-01'],
};

export function FactoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [materials, setMaterials] = useState<RawMaterial[]>(INITIAL_MATERIALS);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [config, setConfig] = useState<FactoryConfig>(INITIAL_CONFIG);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const schedule = useMemo(() => {
    return planProduction(orders, products, materials, config);
  }, [orders, products, materials, config]);

  const addOrder = (productId: string, quantity: number, date: string) => {
    const newOrder: ProductionOrder = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      quantity,
      targetDate: date,
      status: 'pending'
    };
    setOrders([...orders, newOrder]);
  };

  const removeOrder = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const updateMaterialStock = (id: string, newStock: number) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, stock: newStock } : m));
  };

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

  const buildStatePayload = () => ({ products, materials, orders, config });

  const saveNow = async (signal?: AbortSignal) => {
    setSaveStatus('saving');
    setSaveMessage(null);
    const payload = buildStatePayload();
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
  }, []);

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

  return (
    <FactoryContext.Provider value={{
      products, setProducts,
      materials, setMaterials,
      orders, setOrders,
      config, setConfig,
      schedule, addOrder, removeOrder, updateMaterialStock,
      saveStatus, saveMessage, lastSavedAt, saveNow, setSaveStatus
    }}>
      {children}
    </FactoryContext.Provider>
  );
}

export function useFactory() {
  const context = useContext(FactoryContext);
  if (!context) throw new Error('useFactory must be used within FactoryProvider');
  return context;
}
