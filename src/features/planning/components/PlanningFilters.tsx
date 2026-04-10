import React from 'react';
import { format, parseISO } from 'date-fns';
import { Printer, Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  viewType: 'daily' | 'weekly' | 'monthly';
  setViewType: (type: 'daily' | 'weekly' | 'monthly') => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onPrint: () => void;
  onAutoPlanClick: () => void;
  onNewOrderClick: () => void;
}

export function PlanningFilters({ viewType, setViewType, selectedDate, setSelectedDate, onPrint, onAutoPlanClick, onNewOrderClick }: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
      <div className="flex gap-4 flex-wrap">
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
          onClick={onAutoPlanClick}
          className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2 shadow-lg shadow-[#4A2C2A]/20"
        >
          <Plus size={18} /> Criar Planejamento
        </button>
        <button 
          onClick={onNewOrderClick}
          className="bg-white border border-[#E8DCC4] text-[#4A2C2A] px-6 py-2 rounded-xl font-medium hover:bg-[#F7F0E4] transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Novo Pedido
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
          onClick={onPrint}
          className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2"
        >
          <Printer size={18} /> Imprimir Relatório
        </button>
      </div>
    </div>
  );
}