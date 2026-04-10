import { create } from 'zustand';
import { Product, RawMaterial, ProductionOrder, FactoryConfig, Sector, SectorCapacity } from '../types';

export interface AppState {
  // State
  products: Product[];
  materials: RawMaterial[];
  orders: ProductionOrder[];
  config: FactoryConfig;
  sectors: Sector[];
  sectorCapacities: SectorCapacity[];

  // Actions - Sectors
  setSectors: (sectors: Sector[]) => void;
  addSector: (sector: Sector, defaultCapacity: number) => void;
  removeSector: (id: string) => void;
  updateSector: (sector: Sector) => void;
  reorderSectors: (reordered: Sector[]) => void;
  
  // Actions - Sector Capacities
  updateSectorCapacity: (sectorId: string, dailyCapacity: number) => void;

  // Actions - Products
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;

  // Actions - Materials
  setMaterials: (materials: RawMaterial[]) => void;
  updateMaterialStock: (id: string, newStock: number) => void;

  // Actions - Orders
  setOrders: (orders: ProductionOrder[]) => void;
  addOrder: (productId: string, quantity: number, date: string) => void;
  removeOrder: (id: string) => void;
  updateOrder: (order: ProductionOrder) => void;

  // Actions -// Config
  setConfig: (config: FactoryConfig) => void;
  
  // Hydrate
  hydrateState: (data: Partial<AppState>) => void;
}

const INITIAL_MATERIALS: RawMaterial[] = [
  { id: '1', name: 'Cacau em Pó', unit: 'kg', stock: 500 },
  { id: '2', name: 'Açúcar', unit: 'kg', stock: 300 },
  { id: '3', name: 'Leite em Pó', unit: 'kg', stock: 200 },
  { id: '4', name: 'Manteiga de Cacau', unit: 'kg', stock: 150 },
];

const INITIAL_SECTORS: Sector[] = [
  { id: '1', name: 'Refino', order: 1 },
  { id: '2', name: 'Temperagem', order: 2 },
  { id: '3', name: 'Confeitaria', order: 3 },
  { id: '4', name: 'Embalagem', order: 4 },
];

const INITIAL_SECTOR_CAPACITIES: SectorCapacity[] = [
  { sectorId: '1', dailyCapacity: 100 },
  { sectorId: '2', dailyCapacity: 100 },
  { sectorId: '3', dailyCapacity: 100 },
  { sectorId: '4', dailyCapacity: 100 },
];

const INITIAL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Chocolate Amargo 70%', 
    capacityCost: 1, 
    materials: [
      { materialId: '1', amount: 0.7 },
      { materialId: '4', amount: 0.3 }
    ],
    flow: ['1', '2', '3', '4'] 
  },
  { 
    id: '2', 
    name: 'Chocolate ao Leite', 
    capacityCost: 0.8, 
    materials: [
      { materialId: '1', amount: 0.3 },
      { materialId: '2', amount: 0.4 },
      { materialId: '3', amount: 0.3 }
    ],
    flow: ['1', '2', '3', '4'] 
  },
];

const INITIAL_CONFIG: FactoryConfig = {
  dailyCapacity: 100,
  workDays: [1, 2, 3, 4, 5],
  holidays: ['2026-04-21', '2026-05-01'],
};

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  products: INITIAL_PRODUCTS,
  materials: INITIAL_MATERIALS,
  orders: [],
  config: INITIAL_CONFIG,
  sectors: INITIAL_SECTORS,
  sectorCapacities: INITIAL_SECTOR_CAPACITIES,

  // Sectors
  setSectors: (sectors) => set({ sectors }),
  addSector: (sector, defaultCapacity) => set((state) => ({ 
    sectors: [...state.sectors, sector],
    sectorCapacities: [...state.sectorCapacities, { sectorId: sector.id, dailyCapacity: defaultCapacity }]
  })),
  removeSector: (id) => set((state) => ({ 
    sectors: state.sectors.filter(s => s.id !== id),
    sectorCapacities: state.sectorCapacities.filter(c => c.sectorId !== id)
  })),
  updateSector: (sector) => set((state) => ({ sectors: state.sectors.map(s => s.id === sector.id ? sector : s) })),
  reorderSectors: (reordered) => set({ sectors: reordered }),

  // Sector Capacities
  updateSectorCapacity: (sectorId, dailyCapacity) => set((state) => {
    const existing = state.sectorCapacities.find(c => c.sectorId === sectorId);
    if (existing) {
      return {
        sectorCapacities: state.sectorCapacities.map(c => c.sectorId === sectorId ? { ...c, dailyCapacity } : c)
      };
    } else {
      return {
        sectorCapacities: [...state.sectorCapacities, { sectorId, dailyCapacity }]
      };
    }
  }),

  // Products
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (product) => set((state) => ({
    products: state.products.map(p => p.id === product.id ? product : p)
  })),
  removeProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),

  // Materials
  setMaterials: (materials) => set({ materials }),
  updateMaterialStock: (id, newStock) => set((state) => ({
    materials: state.materials.map(m => m.id === id ? { ...m, stock: newStock } : m)
  })),

  // Orders
  setOrders: (orders) => set({ orders }),
  addOrder: (productId, quantity, date) => set((state) => {
    const newOrder: ProductionOrder = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      quantity,
      targetDate: date,
      status: 'pending'
    };
    return { orders: [...state.orders, newOrder] };
  }),
  removeOrder: (id) => set((state) => ({
    orders: state.orders.filter(o => o.id !== id)
  })),
  updateOrder: (order) => set((state) => ({
    orders: state.orders.map(o => o.id === order.id ? order : o)
  })),

  // Config
  setConfig: (config) => set({ config }),
  
  // Reset/Load Entire State
  hydrateState: (data: Partial<AppState>) => set((state) => {
    // Fallback: garante que produtos antigos ganhem um fluxo completo caso não tenham
    const allSectorIds = data.sectors ? data.sectors.map(s => s.id) : state.sectors.map(s => s.id);
    const hydratedProducts = (data.products || state.products).map(p => ({
      ...p,
      flow: p.flow && p.flow.length > 0 ? p.flow : allSectorIds
    }));

    return {
      products: hydratedProducts,
      materials: data.materials || state.materials,
      orders: data.orders || state.orders,
      config: data.config || state.config,
      sectors: data.sectors || state.sectors,
      sectorCapacities: data.sectorCapacities || state.sectorCapacities
    };
  })
}));
