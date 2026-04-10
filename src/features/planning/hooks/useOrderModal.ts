import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../../../store/useAppStore';

type OrderDraft = {
  productId: string;
  quantity: number;
  date: string; // yyyy-MM-dd
};

export function useOrderModal() {
  const products = useAppStore(s => s.products);
  const orders = useAppStore(s => s.orders);

  const addOrder = useAppStore(s => s.addOrder);
  const updateOrder = useAppStore(s => s.updateOrder);
  const removeOrder = useAppStore(s => s.removeOrder);

  const defaultProductId = useMemo(() => products?.[0]?.id ?? '', [products]);

  const makeDraft = useCallback((): OrderDraft => ({
    productId: defaultProductId,
    quantity: 10,
    date: format(new Date(), 'yyyy-MM-dd'),
  }), [defaultProductId]);

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(() => ({
    productId: defaultProductId,
    quantity: 10,
    date: format(new Date(), 'yyyy-MM-dd'),
  }));

  // Se produtos carregarem depois e draft ficar vazio, corrige automaticamente
  useEffect(() => {
    if (!orderDraft.productId && defaultProductId) {
      setOrderDraft(d => ({ ...d, productId: defaultProductId }));
    }
  }, [defaultProductId]); // propositalmente não depende de orderDraft para evitar loop

  const openCreateOrder = useCallback(() => {
    setEditingOrderId(null);
    setOrderDraft(makeDraft());
    setIsEditingOrder(true);
  }, [makeDraft]);

  const openEditOrder = useCallback((orderId: string) => {
    const order = (orders ?? []).find((o: any) => o.id === orderId);
    if (!order) return;

    setEditingOrderId(orderId);
    setOrderDraft({
      productId: order.productId,
      quantity: order.quantity,
      date: order.targetDate,
    });
    setIsEditingOrder(true);
  }, [orders]);

  const closeOrderModal = useCallback(() => {
    setIsEditingOrder(false);
  }, []);

  const saveOrder = useCallback(() => {
    if (!orderDraft.productId || !orderDraft.date || !orderDraft.quantity) return;

    if (editingOrderId) {
      const order = (orders ?? []).find((o: any) => o.id === editingOrderId);
      if (!order) return;

      updateOrder({
        ...order,
        productId: orderDraft.productId,
        quantity: Number(orderDraft.quantity),
        targetDate: orderDraft.date,
        status: 'pending',
      });
    } else {
      addOrder(orderDraft.productId, Number(orderDraft.quantity), orderDraft.date);
    }

    setIsEditingOrder(false);
  }, [orderDraft, editingOrderId, orders, addOrder, updateOrder]);

  const deleteOrder = useCallback((orderId: string) => {
    if (window.confirm('Tem certeza que deseja remover este pedido do planejamento?')) {
      removeOrder(orderId);
    }
  }, [removeOrder]);

  return {
    isEditingOrder,
    editingOrderId,
    orderDraft,
    setOrderDraft,
    openCreateOrder,
    openEditOrder,
    saveOrder,
    deleteOrder,
    closeOrderModal,
  };
}