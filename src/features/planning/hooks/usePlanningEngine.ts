import { useMemo } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { planProduction } from '../../../lib/planner';

export function usePlanningEngine() {
  const products = useAppStore(state => state.products);
  const materials = useAppStore(state => state.materials);
  const orders = useAppStore(state => state.orders);
  const config = useAppStore(state => state.config);

  const { schedule, warnings } = useMemo(
    () => planProduction(orders, products, materials, config),
    [orders, products, materials, config]
  );

  return {
    schedule,
    warnings,
    products,
    orders
  };
}