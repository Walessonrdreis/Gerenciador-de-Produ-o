import React, { useState, useMemo, useEffect } from 'react';
import { 
  Factory, 
  Package, 
  ShoppingCart, 
  Calendar as CalendarIcon, 
  Settings, 
  Plus, 
  Trash2, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Printer,
  BarChart3,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import { 
  Product, 
  RawMaterial, 
  ProductionOrder, 
  FactoryConfig, 
  ScheduledDay 
} from './types';
import { planProduction } from './lib/planner';

import { fetchOmieProducts, fetchOmieFamilies, OmieProduct, OmieFamily } from './services/omieService';

// Initial Mock Data
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
  dailyCapacity: 100, // 100 units per day
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  holidays: ['2026-04-21', '2026-05-01'], // Tiradentes, Dia do Trabalho
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'materials' | 'orders' | 'schedule' | 'planning'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
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
          console.error('Failed to load state:', status, json || text);
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
        console.error('Failed to load state:', error);
        setSaveStatus('error');
        setSaveMessage(error?.message || 'Falha ao carregar.');
        setIsStateLoaded(true);
      });
    return () => {
      isMounted = false;
    };
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D1B08] font-sans flex">
      <div className="fixed bottom-4 right-4 z-50 no-print">
        {saveStatus !== 'idle' && (
          <div className="bg-white border border-[#E8DCC4] shadow-lg rounded-2xl px-4 py-3 flex items-start gap-3 max-w-sm">
            {saveStatus === 'saving' ? (
              <div className="w-5 h-5 border-2 border-[#4A2C2A] border-t-transparent rounded-full animate-spin mt-0.5" />
            ) : saveStatus === 'saved' ? (
              <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4A2C2A]">
                {saveStatus === 'saving' ? 'Salvando…' : saveStatus === 'saved' ? 'Dados salvos' : 'Falha ao salvar'}
              </p>
              {saveStatus === 'saved' && lastSavedAt && (
                <p className="text-xs text-[#8B5E3C] mt-0.5">Último salvamento: {format(lastSavedAt, 'HH:mm:ss')}</p>
              )}
              {saveStatus === 'error' && saveMessage && (
                <p className="text-xs text-red-600 mt-0.5 break-words">{saveMessage}</p>
              )}
              {saveStatus === 'error' && (
                <button
                  onClick={() => saveNow()}
                  className="mt-2 bg-[#4A2C2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#3A2220] transition-colors"
                >
                  Tentar novamente
                </button>
              )}
            </div>
            <button
              onClick={() => setSaveStatus('idle')}
              className="p-1 hover:bg-[#F7F0E4] rounded-lg text-[#8B5E3C]"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {/* Backdrop for mobile */}
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

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ x: (isSidebarOpen || window.innerWidth >= 768) ? 0 : -256 }}
        className={cn(
          "fixed md:sticky left-0 top-0 h-screen w-64 bg-white border-r border-[#E8DCC4] p-6 z-50 no-print shadow-2xl md:shadow-none shrink-0",
          !isSidebarOpen && "hidden md:block"
        )}
      >
        <div className="flex items-center justify-between mb-10">
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

        <nav className="space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            icon={<BarChart3 size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === 'products'} 
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
            icon={<Package size={20} />}
            label="Produtos"
          />
          <NavItem 
            active={activeTab === 'materials'} 
            onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }}
            icon={<Layers size={20} />}
            label="Matéria-Prima"
          />
          <NavItem 
            active={activeTab === 'orders'} 
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            icon={<ShoppingCart size={20} />}
            label="Pedidos"
          />
          <NavItem 
            active={activeTab === 'schedule'} 
            onClick={() => { setActiveTab('schedule'); setIsSidebarOpen(false); }}
            icon={<CalendarIcon size={20} />}
            label="Cronograma"
          />
          <NavItem 
            active={activeTab === 'planning'} 
            onClick={() => { setActiveTab('planning'); setIsSidebarOpen(false); }}
            icon={<BarChart3 size={20} />}
            label="Planejamento"
          />
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-[#F7F0E4] rounded-2xl border border-[#E8DCC4]">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#8B5E3C] uppercase tracking-wider">
              <Settings size={14} />
              Configuração
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8B5E3C] font-medium block mb-1">Capacidade Diária</label>
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

      {/* Main Content */}
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
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">{activeTab === 'dashboard' ? 'Visão Geral' : activeTab}</h2>
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
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                schedule={schedule} 
                config={config} 
                materials={materials}
                orders={orders}
              />
            )}
            {activeTab === 'products' && (
              <ProductsView products={products} setProducts={setProducts} materials={materials} />
            )}
            {activeTab === 'materials' && (
              <MaterialsView materials={materials} updateStock={updateMaterialStock} />
            )}
            {activeTab === 'orders' && (
              <OrdersView 
                orders={orders} 
                products={products} 
                addOrder={addOrder} 
                removeOrder={removeOrder} 
              />
            )}
            {activeTab === 'schedule' && (
              <ScheduleView schedule={schedule} products={products} />
            )}
            {activeTab === 'planning' && (
              <PlanningView 
                schedule={schedule} 
                products={products} 
                orders={orders}
                setOrders={setOrders}
                materials={materials}
                addOrder={addOrder}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-[#4A2C2A] text-white shadow-lg shadow-[#4A2C2A]/20" 
          : "text-[#8B5E3C] hover:bg-[#F7F0E4] hover:text-[#4A2C2A]"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </button>
  );
}

function DashboardView({ schedule, config, materials, orders }: { schedule: ScheduledDay[], config: FactoryConfig, materials: RawMaterial[], orders: ProductionOrder[] }) {
  const chartData = useMemo(() => {
    return schedule.slice(0, 14).map(day => ({
      name: format(parseISO(day.date), 'dd/MM'),
      capacity: day.totalCapacityUsed,
      limit: config.dailyCapacity
    }));
  }, [schedule, config]);

  const totalOrders = orders.length;
  const pendingQuantity = orders.reduce((acc, o) => acc + o.quantity, 0);
  const lowStockMaterials = materials.filter(m => m.stock < 50);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Pedidos Ativos" 
          value={totalOrders.toString()} 
          subtitle={`${pendingQuantity} unidades totais`}
          icon={<ShoppingCart className="text-blue-500" />}
        />
        <StatCard 
          title="Capacidade Média" 
          value={`${Math.round((schedule.reduce((acc, d) => acc + d.totalCapacityUsed, 0) / (schedule.length || 1)))}%`} 
          subtitle="Uso nos próximos 14 dias"
          icon={<BarChart3 className="text-orange-500" />}
        />
        <StatCard 
          title="Alertas de Estoque" 
          value={lowStockMaterials.length.toString()} 
          subtitle={lowStockMaterials.length > 0 ? "Itens abaixo do limite" : "Estoque saudável"}
          icon={<AlertCircle className={lowStockMaterials.length > 0 ? "text-red-500" : "text-green-500"} />}
        />
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <CalendarIcon size={20} className="text-[#4A2C2A]" />
          Projeção de Carga de Trabalho (14 dias)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E6D2" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8B5E3C', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B5E3C', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: '#FDFBF7'}}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E8DCC4', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.capacity > entry.limit ? '#EF4444' : '#4A2C2A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { title: string, value: string, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-[#F7F0E4] rounded-xl">
          {icon}
        </div>
      </div>
      <h4 className="text-[#8B5E3C] text-sm font-medium">{title}</h4>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-[#8B5E3C] mt-2">{subtitle}</p>
    </div>
  );
}

function ProductsView({ products, setProducts, materials }: { products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>>, materials: RawMaterial[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [omieProducts, setOmieProducts] = useState<OmieProduct[]>([]);
  const [omieFamilies, setOmieFamilies] = useState<OmieFamily[]>([]);
  const [omieFamilyFilter, setOmieFamilyFilter] = useState<number | null>(null);
  const [omieSearch, setOmieSearch] = useState('');
  const [isLoadingOmie, setIsLoadingOmie] = useState(false);
  const [isLoadingOmieFamilies, setIsLoadingOmieFamilies] = useState(false);
  const [omieError, setOmieError] = useState<string | null>(null);
  const [omieFamiliesError, setOmieFamiliesError] = useState<string | null>(null);
  const [selectedOmieProducts, setSelectedOmieProducts] = useState<Set<number>>(new Set());
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', capacityCost: 1, materials: [] });

  const handleAddProduct = () => {
    if (newProduct.name) {
      setProducts([...products, { ...newProduct, id: Math.random().toString(36).substr(2, 9) } as Product]);
      setIsAdding(false);
      setNewProduct({ name: '', capacityCost: 1, materials: [] });
    }
  };

  const handleUpdateProduct = () => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
    }
  };

  const loadOmieProducts = async (overrides?: { search?: string; family?: number | null }) => {
    setIsLoadingOmie(true);
    setOmieError(null);
    try {
      const effectiveSearch = overrides?.search ?? omieSearch;
      const effectiveFamily = overrides?.family ?? omieFamilyFilter;
      const data = await fetchOmieProducts(1, effectiveSearch, effectiveFamily || undefined);
      setOmieProducts(data);
    } catch (error) {
      console.error(error);
      setOmieError(error instanceof Error ? error.message : 'Erro ao carregar produtos do Omie.');
    } finally {
      setIsLoadingOmie(false);
    }
  };

  const loadOmieFamilies = async () => {
    setIsLoadingOmieFamilies(true);
    setOmieFamiliesError(null);
    try {
      const data = await fetchOmieFamilies();
      setOmieFamilies(data);
      if (data.length === 0) {
        setOmieFamiliesError('Nenhuma categoria retornada pelo Omie.');
      }
    } catch (error) {
      console.error(error);
      setOmieFamiliesError(error instanceof Error ? error.message : 'Erro ao carregar categorias do Omie.');
    } finally {
      setIsLoadingOmieFamilies(false);
    }
  };

  const toggleOmieSelection = (code: number) => {
    setSelectedOmieProducts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAllOmieProducts = () => {
    setSelectedOmieProducts(new Set(omieProducts.map(p => p.codigo_produto)));
  };

  const clearOmieSelection = () => {
    setSelectedOmieProducts(new Set());
  };

  const importSelectedFromOmie = () => {
    setProducts(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const toImport = omieProducts
        .filter(p => selectedOmieProducts.has(p.codigo_produto))
        .map((omieProd): Product => ({
          id: `omie-${omieProd.codigo_produto}`,
          name: omieProd.descricao,
          capacityCost: 1,
          materials: []
        }))
        .filter(p => !existingIds.has(p.id));

      return toImport.length > 0 ? [...prev, ...toImport] : prev;
    });
    clearOmieSelection();
    setIsImporting(false);
  };

  const openOmieImport = async () => {
    setIsImporting(true);
    clearOmieSelection();
    await Promise.all([loadOmieFamilies(), loadOmieProducts()]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h3 className="text-xl font-bold">Catálogo de Produtos</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              openOmieImport();
            }}
            className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#F7F0E4] transition-colors shadow-sm"
          >
            <Layers size={20} /> Importar Omie
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#4A2C2A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3A2220] transition-colors shadow-lg shadow-[#4A2C2A]/20"
          >
            <Plus size={20} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingProduct(product)}
                className="text-[#8B5E3C] hover:text-[#4A2C2A]"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="w-12 h-12 bg-[#F7F0E4] rounded-2xl flex items-center justify-center text-[#4A2C2A] mb-4">
              <Package size={24} />
            </div>
            <h4 className="font-bold text-lg">{product.name}</h4>
            <p className="text-sm text-[#8B5E3C] mb-4">Custo de Capacidade: {product.capacityCost} un/dia</p>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#8B5E3C] uppercase tracking-wider">Ingredientes</p>
              {product.materials.map(m => {
                const mat = materials.find(rm => rm.id === m.materialId);
                return (
                  <div key={m.materialId} className="flex justify-between text-xs py-1 border-b border-[#F7F0E4] last:border-0">
                    <span>{mat?.name}</span>
                    <span className="font-medium">{m.amount}{mat?.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Adicionar Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                  placeholder="Ex: Trufa de Avelã"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Custo de Capacidade</label>
                <input 
                  type="number" 
                  value={newProduct.capacityCost}
                  onChange={(e) => setNewProduct({...newProduct, capacityCost: Number(e.target.value)})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddProduct}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Editar Produto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Custo de Capacidade</label>
                <input 
                  type="number" 
                  value={editingProduct.capacityCost}
                  onChange={(e) => setEditingProduct({...editingProduct, capacityCost: Number(e.target.value)})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Ingredientes (kg/unidade)</label>
                {materials.map(mat => {
                  const currentMat = editingProduct.materials.find(m => m.materialId === mat.id);
                  return (
                    <div key={mat.id} className="flex items-center gap-3">
                      <span className="text-xs flex-1">{mat.name}</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={currentMat?.amount || 0}
                        onChange={(e) => {
                          const amount = Number(e.target.value);
                          const newMats = [...editingProduct.materials];
                          const index = newMats.findIndex(m => m.materialId === mat.id);
                          if (index >= 0) {
                            newMats[index] = { ...newMats[index], amount };
                          } else {
                            newMats.push({ materialId: mat.id, amount });
                          }
                          setEditingProduct({ ...editingProduct, materials: newMats });
                        }}
                        className="w-20 bg-[#FDFBF7] border border-[#E8DCC4] rounded-lg px-2 py-1 text-sm"
                      />
                      <span className="text-[10px] text-[#8B5E3C]">{mat.unit}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateProduct}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Importar do Omie</h3>
              <button onClick={() => setIsImporting(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar por nome..."
                  value={omieSearch}
                  onChange={(e) => setOmieSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOmieProducts()}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
                <BarChart3 size={18} className="absolute left-3 top-2.5 text-[#8B5E3C]" />
              </div>
              <select
                className="bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                value={omieFamilyFilter || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setOmieFamilyFilter(value);
                  loadOmieProducts({ family: value });
                }}
                disabled={isLoadingOmieFamilies}
              >
                <option value="">Todas as categorias</option>
                {omieFamilies.map(f => (
                  <option key={f.codigo} value={f.codigo}>{f.nome}</option>
                ))}
              </select>
              <button 
                onClick={loadOmieProducts}
                className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
              >
                Buscar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {omieFamiliesError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <AlertCircle size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-bold">Categorias do Omie</p>
                    <p className="text-xs mt-0.5 break-words">{omieFamiliesError}</p>
                    <button
                      onClick={loadOmieFamilies}
                      className="mt-2 bg-white border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      Recarregar categorias
                    </button>
                  </div>
                </div>
              )}
              {omieError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-4">
                  <AlertCircle size={20} />
                  <p className="text-sm">{omieError}</p>
                </div>
              )}
              
              {isLoadingOmie ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#8B5E3C]">
                  <div className="w-8 h-8 border-4 border-[#4A2C2A] border-t-transparent rounded-full animate-spin mb-4" />
                  <p>Carregando produtos do Omie...</p>
                </div>
              ) : omieProducts.length === 0 ? (
                <div className="text-center py-12 text-[#8B5E3C]">Nenhum produto encontrado.</div>
              ) : (
                omieProducts.map(p => (
                  <div
                    key={p.codigo_produto}
                    onClick={() => toggleOmieSelection(p.codigo_produto)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 bg-[#FDFBF7] border rounded-2xl transition-colors group text-left",
                      selectedOmieProducts.has(p.codigo_produto) ? "border-[#4A2C2A]" : "border-[#E8DCC4] hover:border-[#4A2C2A]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOmieProducts.has(p.codigo_produto)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleOmieSelection(p.codigo_produto)}
                        className="mt-1 h-4 w-4"
                      />
                      <div>
                        <p className="font-bold text-[#4A2C2A]">{p.descricao}</p>
                        <p className="text-xs text-[#8B5E3C]">Código: {p.codigo_produto_integracao} | Unidade: {p.unidade}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                      selectedOmieProducts.has(p.codigo_produto)
                        ? "bg-[#4A2C2A] text-white border-[#4A2C2A]"
                        : "bg-white text-[#4A2C2A] border-[#E8DCC4] group-hover:border-[#4A2C2A]"
                    )}>
                      {selectedOmieProducts.has(p.codigo_produto) ? 'Selecionado' : 'Selecionar'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#E8DCC4] flex items-center gap-3 flex-wrap">
              <button
                onClick={selectAllOmieProducts}
                disabled={omieProducts.length === 0}
                className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl font-medium hover:bg-[#F7F0E4] transition-colors disabled:opacity-50"
              >
                Selecionar todos
              </button>
              <button
                onClick={clearOmieSelection}
                disabled={selectedOmieProducts.size === 0}
                className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-4 py-2 rounded-xl font-medium hover:bg-[#F7F0E4] transition-colors disabled:opacity-50"
              >
                Limpar
              </button>
              <div className="flex-1" />
              <button
                onClick={importSelectedFromOmie}
                disabled={selectedOmieProducts.size === 0}
                className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#3A2220] transition-colors disabled:opacity-50"
              >
                Importar ({selectedOmieProducts.size})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MaterialsView({ materials, updateStock }: { materials: RawMaterial[], updateStock: (id: string, stock: number) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Estoque de Matéria-Prima</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {materials.map(material => (
          <div key={material.id} className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#F7F0E4] rounded-xl text-[#4A2C2A]">
                <Layers size={20} />
              </div>
              {material.stock < 50 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Baixo Estoque</span>
              )}
            </div>
            <h4 className="font-bold">{material.name}</h4>
            <div className="mt-4">
              <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold">{material.stock}</span>
                <span className="text-xs text-[#8B5E3C] mb-1">{material.unit}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                value={material.stock}
                onChange={(e) => updateStock(material.id, Number(e.target.value))}
                className="w-full h-1.5 bg-[#F7F0E4] rounded-lg appearance-none cursor-pointer accent-[#4A2C2A]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersView({ orders, products, addOrder, removeOrder }: { orders: ProductionOrder[], products: Product[], addOrder: (p: string, q: number, d: string) => void, removeOrder: (id: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Pedidos de Produção</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#4A2C2A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3A2220] transition-colors"
        >
          <Plus size={20} /> Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8DCC4] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F0E4] text-[#8B5E3C] text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Quantidade</th>
              <th className="px-6 py-4">Data Limite</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F7F0E4]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#8B5E3C]">Nenhum pedido cadastrado.</td>
              </tr>
            ) : (
              orders.map(order => {
                const product = products.find(p => p.id === order.productId);
                return (
                  <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="px-6 py-4 font-medium">{product?.name}</td>
                    <td className="px-6 py-4">{order.quantity} un</td>
                    <td className="px-6 py-4">{format(parseISO(order.targetDate), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase">Pendente</span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => removeOrder(order.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Criar Pedido</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Produto</label>
                <select 
                  value={newOrder.productId}
                  onChange={(e) => setNewOrder({...newOrder, productId: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Quantidade</label>
                <input 
                  type="number" 
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({...newOrder, quantity: Number(e.target.value)})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Data de Entrega</label>
                <input 
                  type="date" 
                  value={newOrder.date}
                  onChange={(e) => setNewOrder({...newOrder, date: e.target.value})}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    addOrder(newOrder.productId, newOrder.quantity, newOrder.date);
                    setIsAdding(false);
                  }}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                >
                  Criar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ScheduleView({ schedule, products }: { schedule: ScheduledDay[], products: Product[] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">Cronograma de Produção Otimizado</h3>
      <div className="space-y-4">
        {schedule.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8DCC4] text-center text-[#8B5E3C]">
            Nenhuma produção agendada. Adicione pedidos para ver o cronograma.
          </div>
        ) : (
          schedule.map(day => (
            <div key={day.date} className="bg-white rounded-3xl border border-[#E8DCC4] overflow-hidden shadow-sm flex flex-col md:flex-row">
              <div className="bg-[#F7F0E4] p-6 md:w-48 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-[#E8DCC4]">
                <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-widest">{format(parseISO(day.date), 'EEE')}</span>
                <span className="text-3xl font-bold">{format(parseISO(day.date), 'dd')}</span>
                <span className="text-sm font-medium text-[#8B5E3C]">{format(parseISO(day.date), 'MMM yyyy')}</span>
              </div>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    Produção do Dia
                  </h4>
                  <span className="text-xs font-bold text-[#8B5E3C]">Carga: {Math.round(day.totalCapacityUsed)}%</span>
                </div>
                <div className="space-y-3">
                  {day.orders.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-xl border border-[#F7F0E4]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#E8DCC4]">
                            <Package size={16} />
                          </div>
                          <span className="text-sm font-medium">{product?.name || 'Produto Desconhecido'}</span>
                        </div>
                        <span className="font-bold text-[#4A2C2A]">{Math.round(item.quantity)} un</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PlanningView({ 
  schedule, 
  products, 
  orders, 
  setOrders, 
  materials,
  addOrder
}: { 
  schedule: ScheduledDay[], 
  products: Product[], 
  orders: ProductionOrder[],
  setOrders: React.Dispatch<React.SetStateAction<ProductionOrder[]>>,
  materials: RawMaterial[],
  addOrder: (p: string, q: number, d: string) => void
}) {
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'auto'>('manual');
  
  // Manual Planning States
  const [manualOrder, setManualOrder] = useState({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
  const [families, setFamilies] = useState<OmieFamily[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  const [autoProducts, setAutoProducts] = useState<OmieProduct[]>([]);
  const [isLoadingAuto, setIsLoadingAuto] = useState(false);
  const [targetStock, setTargetStock] = useState(50); // Default target stock to reach

  useEffect(() => {
    if (isCreating && createMode === 'auto') {
      loadFamilies();
    }
  }, [isCreating, createMode]);

  const loadFamilies = async () => {
    setIsLoadingFamilies(true);
    try {
      const data = await fetchOmieFamilies();
      setFamilies(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  const loadAutoProducts = async () => {
    if (!selectedFamily) return;
    setIsLoadingAuto(true);
    try {
      const data = await fetchOmieProducts(1, '', selectedFamily);
      setAutoProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAuto(false);
    }
  };

  const handleAutoPlan = () => {
    const newOrders: ProductionOrder[] = [];
    autoProducts.forEach(p => {
      const currentStock = p.estoque_atual || 0;
      const needed = targetStock - currentStock;
      
      if (needed > 0) {
        // Check if product exists in our catalog
        const existingProduct = products.find(prod => prod.id === `omie-${p.codigo_produto}` || prod.name === p.descricao);
        
        if (existingProduct) {
          newOrders.push({
            id: Math.random().toString(36).substr(2, 9),
            productId: existingProduct.id,
            quantity: needed,
            targetDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'), // Default to 1 week from now
            status: 'pending'
          });
        }
      }
    });

    if (newOrders.length > 0) {
      setOrders([...orders, ...newOrders]);
      setIsCreating(false);
    } else {
      alert('Nenhum produto com estoque baixo encontrado para esta categoria.');
    }
  };

  const categories = ['Refino', 'Temperagem', 'Confeitaria', 'Embalagem'];

  const filteredSchedule = useMemo(() => {
    if (viewType === 'daily') {
      return schedule.filter(day => format(parseISO(day.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
    } else if (viewType === 'weekly') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
    }
  }, [schedule, viewType, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex gap-4">
          <div className="flex bg-[#F7F0E4] p-1 rounded-xl border border-[#E8DCC4]">
            <button 
              onClick={() => setViewType('daily')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", viewType === 'daily' ? "bg-white shadow-sm text-[#4A2C2A]" : "text-[#8B5E3C]")}
            >
              Diário
            </button>
            <button 
              onClick={() => setViewType('weekly')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", viewType === 'weekly' ? "bg-white shadow-sm text-[#4A2C2A]" : "text-[#8B5E3C]")}
            >
              Semanal
            </button>
            <button 
              onClick={() => setViewType('monthly')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", viewType === 'monthly' ? "bg-white shadow-sm text-[#4A2C2A]" : "text-[#8B5E3C]")}
            >
              Mensal
            </button>
          </div>
          
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2 shadow-lg shadow-[#4A2C2A]/20"
          >
            <Plus size={18} /> Criar Planejamento
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="date" 
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(parseISO(e.target.value))}
            className="bg-white border border-[#E8DCC4] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
          />
          <button 
            onClick={handlePrint}
            className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      </div>

      <div className="print-container">
        {/* Modals */}
        <AnimatePresence>
          {isCreating && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Criar Planejamento</h3>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex bg-[#F7F0E4] p-1 rounded-xl border border-[#E8DCC4] mb-6">
                  <button 
                    onClick={() => setCreateMode('manual')}
                    className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", createMode === 'manual' ? "bg-white shadow-sm text-[#4A2C2A]" : "text-[#8B5E3C]")}
                  >
                    Manual
                  </button>
                  <button 
                    onClick={() => setCreateMode('auto')}
                    className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", createMode === 'auto' ? "bg-white shadow-sm text-[#4A2C2A]" : "text-[#8B5E3C]")}
                  >
                    Automático (Omie)
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {createMode === 'manual' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[#8B5E3C]">Adicione pedidos manualmente para compor o planejamento.</p>
                      <div className="space-y-4 bg-[#FDFBF7] p-6 rounded-2xl border border-[#E8DCC4]">
                        <div>
                          <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Produto</label>
                          <select 
                            value={manualOrder.productId}
                            onChange={(e) => setManualOrder({...manualOrder, productId: e.target.value})}
                            className="w-full bg-white border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                          >
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Quantidade</label>
                            <input 
                              type="number" 
                              value={manualOrder.quantity}
                              onChange={(e) => setManualOrder({...manualOrder, quantity: Number(e.target.value)})}
                              className="w-full bg-white border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Data Limite</label>
                            <input 
                              type="date" 
                              value={manualOrder.date}
                              onChange={(e) => setManualOrder({...manualOrder, date: e.target.value})}
                              className="w-full bg-white border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            addOrder(manualOrder.productId, manualOrder.quantity, manualOrder.date);
                            setIsCreating(false);
                          }}
                          className="w-full bg-[#4A2C2A] text-white py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors"
                        >
                          Adicionar ao Planejamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Categoria (Família Omie)</label>
                          <select 
                            className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                            value={selectedFamily || ''}
                            onChange={(e) => setSelectedFamily(Number(e.target.value))}
                          >
                            <option value="">Selecione uma categoria...</option>
                            {families.map(f => (
                              <option key={f.codigo} value={f.codigo}>{f.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Estoque Alvo</label>
                          <input 
                            type="number"
                            value={targetStock}
                            onChange={(e) => setTargetStock(Number(e.target.value))}
                            className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={loadAutoProducts}
                        disabled={!selectedFamily || isLoadingAuto}
                        className="w-full bg-[#4A2C2A] text-white py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors disabled:opacity-50"
                      >
                        {isLoadingAuto ? 'Consultando Omie...' : 'Analisar Estoque e Sugerir Produção'}
                      </button>

                      {autoProducts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm uppercase tracking-wider text-[#8B5E3C]">Sugestões de Produção</h4>
                          <div className="space-y-2">
                            {autoProducts.map(p => {
                              const currentStock = p.estoque_atual || 0;
                              const needed = targetStock - currentStock;
                              if (needed <= 0) return null;
                              
                              return (
                                <div key={p.codigo_produto} className="flex items-center justify-between p-3 bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl">
                                  <div>
                                    <p className="font-bold text-sm">{p.descricao}</p>
                                    <p className="text-[10px] text-[#8B5E3C]">Estoque Atual: {currentStock} | Falta: {needed}</p>
                                  </div>
                                  <span className="bg-[#4A2C2A] text-white px-3 py-1 rounded-lg text-xs font-bold">+{needed}</span>
                                </div>
                              );
                            })}
                          </div>
                          <button 
                            onClick={handleAutoPlan}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors mt-4"
                          >
                            Confirmar e Gerar Planejamento
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="hidden print-only mb-8 text-center">
          <h1 className="text-2xl font-bold">Relatório de Planejamento de Produção</h1>
          <p className="text-gray-600">
            {viewType === 'daily' && `Data: ${format(selectedDate, 'dd/MM/yyyy')}`}
            {viewType === 'weekly' && `Semana: ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`}
            {viewType === 'monthly' && `Mês: ${format(selectedDate, 'MMMM yyyy', { locale: ptBR })}`}
          </p>
        </div>

        {filteredSchedule.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8DCC4] text-center text-[#8B5E3C]">
            Nenhuma produção encontrada para este período.
          </div>
        ) : (
          <div className="space-y-8">
            {filteredSchedule.map(day => (
              <div key={day.date} className="bg-white rounded-3xl border border-[#E8DCC4] overflow-hidden shadow-sm print-card">
                <div className="bg-[#F7F0E4] p-4 border-b border-[#E8DCC4] flex justify-between items-center">
                  <h4 className="font-bold text-[#4A2C2A]">
                    {format(parseISO(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <span className="text-xs font-bold text-[#8B5E3C]">Carga: {Math.round(day.totalCapacityUsed)}%</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#F7F0E4]">
                  {categories.map(category => (
                    <div key={category} className="p-6">
                      <h5 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#4A2C2A]" />
                        {category}
                      </h5>
                      <div className="space-y-3">
                        {day.orders.map((item, idx) => {
                          const product = products.find(p => p.id === item.productId);
                          return (
                            <div key={idx} className="text-sm">
                              <div className="font-semibold">{product?.name}</div>
                              <div className="text-[#8B5E3C] text-xs">{Math.round(item.quantity)} unidades</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
