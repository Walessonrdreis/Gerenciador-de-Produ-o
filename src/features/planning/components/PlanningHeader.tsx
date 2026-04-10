import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  onAddOrder: () => void;
}

export function PlanningHeader({ onAddOrder }: Props) {
  return (
    <div className="flex justify-between items-center gap-4 flex-wrap">
      <h3 className="text-xl font-bold">Planejamento da Produção</h3>
      <button 
        onClick={onAddOrder}
        className="bg-[#4A2C2A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3A2220] transition-colors shadow-lg shadow-[#4A2C2A]/20"
      >
        <Plus size={20} /> Adicionar ao Planejamento
      </button>
    </div>
  );
}