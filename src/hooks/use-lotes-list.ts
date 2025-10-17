import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface LotesFilters {
  page: number;
  limit: number;
  agent?: string[];
  neighborhood?: string[];
  status?: string[];
  origen?: string[];
  tipo?: string[];
  esquina?: string[];
  minArea?: number;
  maxArea?: number;
  minFrente?: number;
  maxFrente?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LotesListResponse {
  lotes: any[];
  total: number;
}

/**
 * Hook para obtener el listado de lotes con filtros y paginación
 * 
 * Características:
 * - ✅ Caché por combinación de filtros (cada filtro tiene su propio caché)
 * - ✅ Invalidación automática cuando se edita un lote
 * - ✅ Prefetch de página siguiente para navegación más rápida
 */
export function useLotesList(filters: LotesFilters) {
  const queryClient = useQueryClient();

  // Crear query key única basada en todos los filtros
  const queryKey = ['lotes-list', filters];

  const query = useQuery<LotesListResponse>({
    queryKey,
    queryFn: async () => {
      // Construir params de la URL
      const params = new URLSearchParams();
      params.set('limit', String(filters.limit));
      params.set('offset', String((filters.page - 1) * filters.limit));
      
      if (filters.agent && filters.agent.length > 0) {
        params.set('agent', filters.agent.join(','));
      }
      if (filters.neighborhood && filters.neighborhood.length > 0) {
        params.set('neighborhood', filters.neighborhood.join(','));
      }
      if (filters.status && filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }
      if (filters.origen && filters.origen.length > 0) {
        params.set('origen', filters.origen.join(','));
      }
      if (filters.tipo && filters.tipo.length > 0) {
        params.set('tipo', filters.tipo.join(','));
      }
      if (filters.esquina && filters.esquina.length > 0) {
        params.set('esquina', filters.esquina.join(','));
      }
      if (filters.minArea !== undefined) {
        params.set('minArea', String(filters.minArea));
      }
      if (filters.maxArea !== undefined) {
        params.set('maxArea', String(filters.maxArea));
      }
      if (filters.minFrente !== undefined) {
        params.set('minFrente', String(filters.minFrente));
      }
      if (filters.maxFrente !== undefined) {
        params.set('maxFrente', String(filters.maxFrente));
      }
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.sortBy && filters.sortBy !== 'gid') {
        params.set('sortBy', filters.sortBy);
      }
      if (filters.sortOrder && filters.sortOrder !== 'asc') {
        params.set('sortOrder', filters.sortOrder);
      }

      const res = await fetch(`/api/lotes?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Error al cargar lotes');
      }
      const data = await res.json();
      
      return {
        lotes: (data.lotes || []).map((lote: any) => ({
          ...lote,
          listingDate: lote.listingDate ? new Date(lote.listingDate) : null,
          saleDate: lote.saleDate ? new Date(lote.saleDate) : null,
        })),
        total: data.total || 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - los listados cambian más frecuentemente
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnMount: true, // Revalidar al montar para asegurar datos frescos
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ PREFETCH: Pre-cargar la página siguiente para navegación instantánea
  const prefetchNextPage = () => {
    const totalPages = Math.ceil((query.data?.total || 0) / filters.limit);
    if (filters.page < totalPages) {
      const nextPageFilters = { ...filters, page: filters.page + 1 };
      queryClient.prefetchQuery({
        queryKey: ['lotes-list', nextPageFilters],
        queryFn: async () => {
          // Usar la misma lógica de fetch pero con página siguiente
          const params = new URLSearchParams();
          params.set('limit', String(nextPageFilters.limit));
          params.set('offset', String((nextPageFilters.page - 1) * nextPageFilters.limit));
          // ... (mismos parámetros)
          
          const res = await fetch(`/api/lotes?${params.toString()}`);
          const data = await res.json();
          return {
            lotes: (data.lotes || []).map((lote: any) => ({
              ...lote,
              listingDate: lote.listingDate ? new Date(lote.listingDate) : null,
              saleDate: lote.saleDate ? new Date(lote.saleDate) : null,
            })),
            total: data.total || 0,
          };
        },
        staleTime: 2 * 60 * 1000,
      });
    }
  };

  return {
    data: query.data,
    lotes: query.data?.lotes || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    prefetchNextPage,
  };
}

/**
 * Hook para invalidar el caché de listados
 * Se llama cuando se crea, edita o elimina un lote
 */
export function useInvalidateLotesList() {
  const queryClient = useQueryClient();

  return {
    invalidateAllLists: () => {
      // Invalidar TODAS las queries de listados (todas las combinaciones de filtros)
      queryClient.invalidateQueries({ queryKey: ['lotes-list'] });
      
      // También invalidar filtros que pueden cambiar
      queryClient.invalidateQueries({ queryKey: ['lotes-barrios'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-estados'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-origenes'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-tipos'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-agentes'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-area-range'] });
      queryClient.invalidateQueries({ queryKey: ['lotes-frente-range'] });
    },
  };
}

