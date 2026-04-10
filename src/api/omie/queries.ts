import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOmieFamilies, fetchOmieProducts, OmieFamily, OmieProduct } from '../omieService';
import { Product, ProductionOrder } from '../../types';
import { format, addDays } from 'date-fns';

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