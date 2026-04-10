import React from 'react';
import { Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function MaterialsView() {
  const materials = useAppStore(state => state.materials);
  const updateStock = useAppStore(state => state.updateMaterialStock);
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

