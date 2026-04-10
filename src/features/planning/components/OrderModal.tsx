import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Product } from '../../../types';

interface OrderDraft {
  productId: string;
  quantity: number;
  date: string;
}

interface Props {
  isEditing: boolean;
  orderDraft: OrderDraft;
  products: Product[];
  setOrderDraft: (draft: OrderDraft) => void;
  onClose: () => void;
  onSave: () => void;
}

export function OrderModal({ isEditing, orderDraft, products, setOrderDraft, onClose, onSave }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">{isEditing ? 'Editar Pedido' : 'Criar Pedido'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Produto</label>
            <select
              value={orderDraft.productId}
              onChange={(e) => setOrderDraft({ ...orderDraft, productId: e.target.value })}
              className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Quantidade</label>
              <input
                type="number"
                value={orderDraft.quantity}
                onChange={(e) => setOrderDraft({ ...orderDraft, quantity: Number(e.target.value) })}
                className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8B5E3C] mb-1">Data Limite</label>
              <input
                type="date"
                value={orderDraft.date}
                onChange={(e) => setOrderDraft({ ...orderDraft, date: e.target.value })}
                className="w-full bg-[#FDFBF7] border border-[#E8DCC4] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4A2C2A]/20"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}