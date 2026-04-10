import { Product, RawMaterial, ProductionOrder, FactoryConfig } from '../types';

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

export interface AppStatePayload {
  products: Product[];
  materials: RawMaterial[];
  orders: ProductionOrder[];
  config: FactoryConfig;
}

export async function getState(): Promise<AppStatePayload> {
  const { ok, status, json, text } = await fetchJson('/api/state', { method: 'GET' });
  if (!ok) {
    const message = json?.error || json?.message || text || `HTTP ${status}`;
    throw new Error(typeof message === 'string' ? message : `Erro ao carregar (HTTP ${status}).`);
  }
  return json?.data || {};
}

export async function saveState(payload: AppStatePayload, signal?: AbortSignal): Promise<void> {
  const { ok, status, json, text } = await fetchJson('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });
  if (!ok) {
    const message = json?.error || json?.message || text || `HTTP ${status}`;
    throw new Error(typeof message === 'string' ? message : `Erro ao salvar (HTTP ${status}).`);
  }
}