import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '../../../store/useAppStore';
import { useOmieProducts, useOmieFamilies, useCreateAutoOrders } from '../../../api/omie/queries';

export function useAutoPlanModal() {
  const products = useAppStore(state => state.products);
  const orders = useAppStore(state => state.orders);
  const addOrder = useAppStore(state => state.addOrder);
  const setOrders = useAppStore(state => state.setOrders);

  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'auto'>('manual');
  
  const [manualOrder, setManualOrder] = useState({ productId: '', quantity: 10, date: format(new Date(), 'yyyy-MM-dd') });
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [targetStock, setTargetStock] = useState(50);

  // Edge case fallback: Preenche productId caso os produtos terminem de carregar depois
  useEffect(() => {
    if (products.length > 0 && !manualOrder.productId) {
      setManualOrder(prev => ({ ...prev, productId: products[0].id }));
    }
  }, [products, manualOrder.productId]);

  const { data: families, isLoading: isLoadingFamilies } = useOmieFamilies({ enabled: isCreating && createMode === 'auto' });
  const { data: autoProducts, isLoading: isLoadingAuto } = useOmieProducts(1, '', selectedFamily, { enabled: isCreating && createMode === 'auto' && selectedFamily !== null });
  const createAutoOrdersMutation = useCreateAutoOrders();

  const handleAutoPlan = useCallback(() => {
    if (!autoProducts) return;
    createAutoOrdersMutation.mutate({
      autoProducts,
      targetStock,
      existingProducts: products,
      existingOrders: orders,
      setOrders
    }, {
      onSuccess: () => setIsCreating(false),
      onError: (err) => alert(err.message)
    });
  }, [autoProducts, targetStock, products, orders, setOrders, createAutoOrdersMutation]);

  const handleAddManualOrder = useCallback(() => {
    if (!manualOrder.productId || !manualOrder.date || !manualOrder.quantity) return;
    addOrder(manualOrder.productId, Number(manualOrder.quantity), manualOrder.date);
    setIsCreating(false);
  }, [manualOrder, addOrder]);

  const openAutoPlanModal = useCallback(() => {
    setIsCreating(true);
    setManualOrder(prev => ({ ...prev, productId: products[0]?.id || '' }));
  }, [products]);

  const closeAutoPlanModal = useCallback(() => {
    setIsCreating(false);
  }, []);

  return {
    isCreating,
    createMode,
    setCreateMode,
    manualOrder,
    setManualOrder,
    handleAddManualOrder,
    selectedFamily,
    setSelectedFamily,
    targetStock,
    setTargetStock,
    families,
    isLoadingFamilies,
    autoProducts,
    isLoadingAuto,
    isPendingAutoOrders: createAutoOrdersMutation.isPending,
    handleAutoPlan,
    openAutoPlanModal,
    closeAutoPlanModal
  };
}