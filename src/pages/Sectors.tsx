import React, { useState } from 'react';
import { Settings, Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Sector } from '../types';

export default function SectorsView() {
  const sectors = useAppStore(state => state.sectors);
  const addSector = useAppStore(state => state.addSector);
  const removeSector = useAppStore(state => state.removeSector);
  const reorderSectors = useAppStore(state => state.reorderSectors);

  const updateSector = useAppStore(state => state.updateSector);

  const [isAdding, setIsAdding] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorCapacity, setNewSectorCapacity] = useState(100);

  const handleAddSector = () => {
    if (newSectorName.trim()) {
      const nextOrder = sectors.length > 0 ? Math.max(...sectors.map(s => s.order)) + 1 : 1;
      addSector({
        id: Math.random().toString(36).substr(2, 9),
        name: newSectorName.trim(),
        order: nextOrder,
        capacity: { daily: newSectorCapacity }
      });
      setNewSectorName('');
      setNewSectorCapacity(100);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-bold">Setores de Produção</h3>
          <p className="text-sm text-[#8B5E3C]">Gerencie as etapas e áreas da sua fábrica</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#4A2C2A] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#3A2220] transition-colors shadow-lg shadow-[#4A2C2A]/20"
        >
          <Plus size={20} /> Novo Setor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8DCC4] p-6 shadow-sm">
        {!sectors || sectors.length === 0 ? (
          <div className="text-center py-12 text-[#8B5E3C]">
            <Settings size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum setor cadastrado.</p>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={sectors} 
            onReorder={reorderSectors} 
            className="space-y-3"
          >
            {sectors.map((sector) => {
              if (!sector || !sector.id) return null;
              
              const currentDaily = sector.capacity?.daily ?? 100;
              
              return (
              <Reorder.Item 
                key={sector.id} 
                value={sector}
                className="flex items-center justify-between p-4 bg-[#FDFBF7] border border-[#E8DCC4] rounded-2xl cursor-grab active:cursor-grabbing group hover:border-[#4A2C2A] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="text-[#E8DCC4] group-hover:text-[#8B5E3C] transition-colors" size={20} />
                  <div className="w-10 h-10 bg-white border border-[#E8DCC4] rounded-xl flex items-center justify-center text-[#4A2C2A] font-bold shrink-0">
                    {sector.order}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1">
                    <p className="font-bold text-[#4A2C2A] text-lg w-40 truncate">{sector.name}</p>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E8DCC4]">
                      <span className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider">Capacidade:</span>
                      <input 
                        type="number"
                        min="1"
                        value={currentDaily}
                        onChange={(e) => updateSector({ ...sector, capacity: { daily: Number(e.target.value) || 1 } })}
                        className="w-16 bg-transparent text-right font-bold text-[#4A2C2A] focus:outline-none"
                      />
                      <span className="text-xs text-[#8B5E3C]">un/dia</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este setor?')) {
                      removeSector(sector.id);
                    }
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </Reorder.Item>
            )})}
          </Reorder.Group>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Adicionar Setor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Nome do Setor</label>
                <input 
                  type="text" 
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                  placeholder="Ex: Embalagem Seca"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Capacidade Diária (unidades)</label>
                <input 
                  type="number" 
                  min="1"
                  value={newSectorCapacity}
                  onChange={(e) => setNewSectorCapacity(Number(e.target.value))}
                  className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
                  placeholder="Ex: 100"
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
                  onClick={handleAddSector}
                  disabled={!newSectorName.trim()}
                  className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors disabled:opacity-50"
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