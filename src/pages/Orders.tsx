import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Trash2, X } from 'lucide-react';
import { ProductionOrder } from '../types';
import { useAppStore } from '../store/useAppStore';

export default function OrdersView() {
  const orders = useAppStore(state => state.orders);
  const products = useAppStore(state => state.products);
  const addOrder = useAppStore(state => state.addOrder);
  const removeOrder = useAppStore(state => state.removeOrder);
  const updateOrder = useAppStore(state => state.updateOrder);
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
