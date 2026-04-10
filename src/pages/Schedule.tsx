import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckCircle2, Package } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { planProduction } from '../lib/planner';

export default function ScheduleView() {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);
  
  const computedSchedule = useMemo(() => planProduction(orders, products, materials, config), [orders, products, materials, config]);
  const schedule = computedSchedule;
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
