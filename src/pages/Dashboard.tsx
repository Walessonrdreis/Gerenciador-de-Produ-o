import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ShoppingCart, Calendar as CalendarIcon, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { planProduction } from '../lib/planner';

export default function DashboardView() {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);
  
  const schedule = useMemo(() => planProduction(orders, products, materials, config), [orders, products, materials, config]);
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
