import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../../../store/useAppStore';

export function useOrderModal() {
  const products = useAppStore(state => state.products);
  const orders = useAppStore(state => state.orders);
  const addOrder = useAppStore(state => state.addOrder);
  const updateOrder = useAppStore(state => state.updateOrder);
  const removeOrder = useAppStore(state => state.removeOrder);

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState({ productId: '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });

  // Fallback/Edge case: Ensures draft gets a valid productId if products array loads later
  useEffect(() => {
    if (products.length > 0 && !orderDraft.productId) {
      setOrderDraft(prev => ({ ...prev, productId: products[0].id }));
    }
  }, [products, orderDraft.productId]);

  const openCreateOrder = useCallback(() => {
    setEditingOrderId(null);
    setOrderDraft({ productId: products[0]?.id || '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
    setIsEditingOrder(true);
  }, [products]);

  const openEditOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    setEditingOrderId(orderId);
    setOrderDraft({ productId: order.productId, quantity: order.quantity, date: order.targetDate });
    setIsEditingOrder(true);
  }, [orders]);

  const saveOrder = useCallback(() => {
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
  }, [orderDraft, editingOrderId, orders, updateOrder, addOrder]);

  const deleteOrder = useCallback((orderId: string) => {
    if (window.confirm('Tem certeza que deseja remover este pedido do planejamento?')) {
      removeOrder(orderId);
    }
  }, [removeOrder]);

  const closeOrderModal = useCallback(() => {
    setIsEditingOrder(false);
  }, []);

  return {
    isEditingOrder,
    editingOrderId,
    orderDraft,
    setOrderDraft,
    openCreateOrder,
    openEditOrder,
    saveOrder,
    deleteOrder,
    closeOrderModal
  };
}