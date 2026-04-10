import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOmieFamilies, fetchOmieProducts, OmieFamily, OmieProduct } from '../omieService';
import { Product, ProductionOrder } from '../../types';
import { format, addDays } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';

export function useOmieFamilies(options?: { enabled?: boolean }) {
  return useQuery<OmieFamily[], Error>({
    queryKey: ['omie', 'families'],
    queryFn: () => fetchOmieFamilies(),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 30, // Famílias mudam raramente, cache de 30 mins
  });
}

export function useOmieProducts(
  page: number = 1,
  search?: string,
  familyCode?: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery<OmieProduct[], Error>({
    queryKey: ['omie', 'products', { page, search, familyCode }],
    queryFn: () => fetchOmieProducts(page, search, familyCode || undefined),
    enabled: options?.enabled ?? true,
    // Produtos podem ser atualizados (estoque), mas mantemos cache por 5 minutos via defaultOptions no QueryClient
  });
}

// ---------------------------------------------------------
// Mutations
// ---------------------------------------------------------

interface ImportOmieProductsParams {
  omieProducts: OmieProduct[];
  selectedCodes: Set<number>;
  existingProducts: Product[];
  setProducts: (products: Product[]) => void;
}

export function useImportOmieProducts() {
  const queryClient = useQueryClient();
  const allSectorIds = useAppStore(state => state.sectors).map(s => s.id);

  return useMutation<Product[], Error, ImportOmieProductsParams>({
    mutationFn: async ({ omieProducts, selectedCodes, existingProducts, setProducts }) => {
      // Simular um atraso para não travar a UI e demonstrar feedback assíncrono caso a lista seja gigante
      await new Promise(resolve => setTimeout(resolve, 500));

      const toAdd = omieProducts
        .filter(p => selectedCodes.has(p.codigo_produto))
        .filter(p => !existingProducts.some(existing => existing.id === `omie-${p.codigo_produto}` || existing.name === p.descricao))
        .map(p => ({
          id: `omie-${p.codigo_produto}`,
          name: p.descricao,
          capacityCost: 1, // Default capacity cost
          materials: [], // Needs to be configured later
          flow: allSectorIds // Default flow: all sectors
        } as Product));

      if (toAdd.length > 0) {
        setProducts([...existingProducts, ...toAdd]);
      }
      return toAdd;
    },
    onSuccess: () => {
      // Invalida a busca de produtos do Omie para forçar atualização no background se necessário
      queryClient.invalidateQueries({ queryKey: ['omie', 'products'] });
    },
    onError: (error) => {
      console.error('Erro ao importar produtos da Omie:', error);
    }
  });
}

interface CreateAutoOrdersParams {
  autoProducts: OmieProduct[];
  targetStock: number;
  existingProducts: Product[];
  existingOrders: ProductionOrder[];
  setOrders: (orders: ProductionOrder[]) => void;
}

export function useCreateAutoOrders() {
  return useMutation<ProductionOrder[], Error, CreateAutoOrdersParams>({
    mutationFn: async ({ autoProducts, targetStock, existingProducts, existingOrders, setOrders }) => {
      // Simular um pequeno processamento assíncrono para liberar a thread principal
      await new Promise(resolve => setTimeout(resolve, 600));

      const newOrders: ProductionOrder[] = [];
      autoProducts.forEach(p => {
        const currentStock = p.estoque_atual || 0;
        const needed = targetStock - currentStock;
        
        if (needed > 0) {
          const existingProduct = existingProducts.find(prod => prod.id === `omie-${p.codigo_produto}` || prod.name === p.descricao);
          
          if (existingProduct) {
            newOrders.push({
              id: Math.random().toString(36).substr(2, 9),
              productId: existingProduct.id,
              quantity: needed,
              targetDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
              status: 'pending'
            });
          }
        }
      });

      if (newOrders.length === 0) {
        throw new Error('Nenhum produto com estoque baixo foi encontrado ou eles não existem no catálogo local.');
      }

      setOrders([...existingOrders, ...newOrders]);
      return newOrders;
    },
    onError: (error) => {
      console.error('Erro ao gerar pedidos automáticos:', error);
    }
  });
}