import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Settings, Plus, X, Package, Trash2, Printer
} from 'lucide-react';
import { ProductionOrder } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useOmieProducts, useOmieFamilies, useCreateAutoOrders } from '../api/omie/queries';
import { planProduction } from '../lib/planner';
import { cn } from '../lib/utils';

export default function PlanningView() {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);
  const updateOrder = useAppStore(state => state.updateOrder);
  const removeOrder = useAppStore(state => state.removeOrder);
  const addOrder = useAppStore(state => state.addOrder);
  const setOrders = useAppStore(state => state.setOrders);
  
  const schedule = useMemo(() => planProduction(orders, products, materials, config), [orders, products, materials, config]);
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'auto'>('manual');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
  
  // Manual Planning States
  const [manualOrder, setManualOrder] = useState({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [targetStock, setTargetStock] = useState(50); // Default target stock to reach

  const { data: families, isLoading: isLoadingFamilies } = useOmieFamilies({ enabled: isCreating && createMode === 'auto' });
  const { data: autoProducts, isLoading: isLoadingAuto, error: autoError } = useOmieProducts(1, '', selectedFamily, { enabled: isCreating && createMode === 'auto' && selectedFamily !== null });
  const createAutoOrdersMutation = useCreateAutoOrders();

  const handleAutoPlan = () => {
    if (!autoProducts) return;
    
    createAutoOrdersMutation.mutate({
      autoProducts,
      targetStock,
      existingProducts: products,
      existingOrders: orders,
      setOrders
    }, {
      onSuccess: () => {
        setIsCreating(false);
      },
      onError: (err) => {
        alert(err.message);
      }
    });
  };

  const openCreateOrder = () => {
    setEditingOrderId(null);
    setOrderDraft({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
    setIsEditingOrder(true);
  };

  const openEditOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setEditingOrderId(orderId);
    setOrderDraft({ productId: order.productId, quantity: order.quantity, date: order.targetDate });
    setIsEditingOrder(true);
  };

  const saveOrder = () => {
    if (!orderDraft.productId || !orderDraft.date || !orderDraft.quantity) return;
    if (editingOrderId) {
      const order = orders.find(o => o.id === editingOrderId);
      if (order) {
        updateOrder({
          ...order,
          productId: orderDraft.productId,
          quantity: Number(orderDraft.quantity),
          targetDate: orderDraft.date,
          status: 'pending'
        });
      }
    } else {
      addOrder(orderDraft.productId, Number(orderDraft.quantity), orderDraft.date);
    }
    setIsEditingOrder(false);
  };

  const deleteOrder = (orderId: string) => {
    if (window.confirm('Tem certeza que deseja remover este pedido do planejamento?')) {
      removeOrder(orderId);
    }
  };

  const filteredSchedule = useMemo(() => {
    if (viewType === 'daily') {
      return schedule.filter(day => format(parseISO(day.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
    } else if (viewType === 'weekly') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return schedule.filter(day => isWithinInterval(parseISO(day.date), { start, end }));
    }
  }, [schedule, viewType, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="flex gap-4">
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
            onClick={() => setIsCreating(true)}
            className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2 shadow-lg shadow-[#4A2C2A]/20"
          >
            <Plus size={18} /> Criar Planejamento
          </button>
          <button 
            onClick={openCreateOrder}
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
            onClick={handlePrint}
            className="bg-[#4A2C2A] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      </div>

      <div className="print-container">
        {/* Modals */}
        <AnimatePresence>
          {isEditingOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">{editingOrderId ? 'Editar Pedido' : 'Criar Pedido'}</h3>
                  <button onClick={() => setIsEditingOrder(false)} className="p-2 hover:bg-gray-100 rounded-full">
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
                      onClick={() => setIsEditingOrder(false)}
                      className="flex-1 px-4 py-2 rounded-xl border border-[#E8DCC4] font-medium hover:bg-[#FDFBF7] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveOrder}
                      className="flex-1 bg-[#4A2C2A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#3A2220] transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {isCreating && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold">Criar Planejamento</h3>
                  <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-100 rounded-full">
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
                          onClick={() => {
                            addOrder(manualOrder.productId, manualOrder.quantity, manualOrder.date);
                            setIsCreating(false);
                          }}
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
                            onChange={(e) => setSelectedFamily(Number(e.target.value))}
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
                          onClick={handleAutoPlan}
                          disabled={isLoadingAuto || !selectedFamily || !autoProducts || createAutoOrdersMutation.isPending}
                          className="w-full bg-[#4A2C2A] text-white py-3 rounded-xl font-bold hover:bg-[#3A2220] transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {isLoadingAuto || createAutoOrdersMutation.isPending ? (
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
                            onClick={handleAutoPlan}
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
          )}
        </AnimatePresence>

        <div className="hidden print-only mb-8 text-center">
          <h1 className="text-2xl font-bold">Relatório de Planejamento de Produção</h1>
          <p className="text-gray-600">
            {viewType === 'daily' && `Data: ${format(selectedDate, 'dd/MM/yyyy')}`}
            {viewType === 'weekly' && `Semana: ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM')} a ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`}
            {viewType === 'monthly' && `Mês: ${format(selectedDate, 'MMMM yyyy', { locale: ptBR })}`}
          </p>
        </div>

        {filteredSchedule.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E8DCC4] text-center text-[#8B5E3C]">
            Nenhuma produção encontrada para este período.
          </div>
        ) : (
          <div className="space-y-8">
            {filteredSchedule.map(day => (
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
                                onClick={() => openEditOrder(item.orderId)}
                                className="text-[#8B5E3C] hover:text-[#4A2C2A] transition-colors"
                              >
                                <Settings size={18} />
                              </button>
                              <button
                                onClick={() => deleteOrder(item.orderId)}
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
      </div>
    </div>
  );
}
