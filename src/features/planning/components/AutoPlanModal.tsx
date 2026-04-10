import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Product } from '../../../types';
import { OmieFamily, OmieProduct } from '../../../api/omieService';
import { cn } from '../../../lib/utils';

interface ManualOrder {
  productId: string;
  quantity: number;
  date: string;
}

interface Props {
  createMode: 'manual' | 'auto';
  setCreateMode: (mode: 'manual' | 'auto') => void;
  products: Product[];
  manualOrder: ManualOrder;
  setManualOrder: (order: ManualOrder) => void;
  onAddManualOrder: () => void;
  families: OmieFamily[] | undefined;
  isLoadingFamilies: boolean;
  selectedFamily: number | null;
  setSelectedFamily: (familyId: number | null) => void;
  targetStock: number;
  setTargetStock: (stock: number) => void;
  isLoadingAuto: boolean;
  isPendingAutoOrders: boolean;
  autoProducts: OmieProduct[] | undefined;
  onAutoPlan: () => void;
  onClose: () => void;
}

export function AutoPlanModal({
  createMode, setCreateMode,
  products, manualOrder, setManualOrder, onAddManualOrder,
  families, isLoadingFamilies, selectedFamily, setSelectedFamily,
  targetStock, setTargetStock,
  isLoadingAuto, isPendingAutoOrders, autoProducts, onAutoPlan,
  onClose
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Criar Planejamento</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
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
                  onClick={onAddManualOrder}
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
                    onChange={(e) => setSelectedFamily(e.target.value ? Number(e.target.value) : null)}
                    disabled={isLoadingFamilies}
                  >
                    <option value="">Selecione uma categoria...</option>
                    {families?.map(f => (
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
                  onClick={onAutoPlan}
                  disabled={isLoadingAuto || !selectedFamily || !autoProducts || isPendingAutoOrders}
                  className="w-full bg-[#4A2C2A] text-white py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoadingAuto || isPendingAutoOrders ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Gerar Planejamento'
                  )}
                </button>

              {autoProducts && autoProducts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-[#8B5E3C]">Sugestões de Produção</h4>
                  <div className="bg-[#FDFBF7] border border-[#E8DCC4] rounded-2xl p-4 max-h-[300px] overflow-y-auto">
                    {autoProducts.map(p => {
                      const needed = targetStock - (p.estoque_atual || 0);
                      if (needed <= 0) return null;
                      return (
                        <div key={p.codigo_produto} className="flex justify-between items-center py-2 border-b border-[#F7F0E4] last:border-0">
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-[#4A2C2A] truncate">{p.descricao}</p>
                            <p className="text-xs text-[#8B5E3C]">Estoque: {p.estoque_atual || 0} → Meta: {targetStock}</p>
                          </div>
                          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm">
                            +{needed} un
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={onAutoPlan}
                    className="w-full bg-[#4A2C2A] text-white py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors"
                  >
                    Aprovar e Criar Pedidos
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}