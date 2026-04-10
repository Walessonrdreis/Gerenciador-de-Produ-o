import React from 'react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Settings, Trash2 } from 'lucide-react';
import { Product, ScheduledDay } from '../../../types';

interface Props {
  schedule: ScheduledDay[];
  products: Product[];
  viewType: 'daily' | 'weekly' | 'monthly';
  selectedDate: Date;
  onEditOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function PlanningSchedule({ schedule, products, viewType, selectedDate, onEditOrder, onDeleteOrder }: Props) {
  return (
    <>
      <div className="hidden print-only mb-8 text-center">
        <h1 className="text-2xl font-bold">Relatório de Planejamento de Produção</h1>
        <p className="text-gray-600">
          {viewType === 'daily' && `Data: ${format(selectedDate, 'dd/MM/yyyy')}`}
          {viewType === 'weekly' && `Semana: ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`}
          {viewType === 'monthly' && `Mês: ${format(selectedDate, 'MMMM yyyy', { locale: ptBR })}`}
        </p>
      </div>

      {schedule.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8DCC4] text-center text-[#8B5E3C]">
          Nenhuma produção encontrada para este período.
        </div>
      ) : (
        <div className="space-y-8">
          {schedule.map(day => (
            <div key={day.date} className="bg-white rounded-3xl border border-[#E8DCC4] overflow-hidden shadow-sm print-card">
              <div className="bg-[#F7F0E4] p-4 border-b border-[#E8DCC4] flex justify-between items-center">
                <h4 className="font-bold text-[#4A2C2A]">
                  {format(parseISO(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h4>
                <span className="text-xs font-bold text-[#8B5E3C]">Carga: {Math.round(day.totalCapacityUsed)}%</span>
              </div>
              
              <div className="p-6">
                {day.orders.length === 0 ? (
                  <div className="text-sm text-[#8B5E3C]">Nenhum item agendado para este dia.</div>
                ) : (
                  <div className="space-y-3">
                    {day.orders.map((item) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={`${item.orderId}-${item.productId}-${item.quantity}`} className="flex items-center justify-between p-3 bg-[#FDFBF7] rounded-xl border border-[#F7F0E4]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#E8DCC4]">
                              <Package size={16} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{product?.name || 'Produto Desconhecido'}</div>
                              <div className="text-[#8B5E3C] text-xs">{Math.round(item.quantity)} unidades</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 no-print">
                            <button
                              onClick={() => onEditOrder(item.orderId)}
                              className="text-[#8B5E3C] hover:text-[#4A2C2A] transition-colors"
                            >
                              <Settings size={18} />
                            </button>
                            <button
                              onClick={() => onDeleteOrder(item.orderId)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}