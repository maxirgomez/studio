import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Hook para prefetch de datos críticos en el layout
 * Carga datos antes de que el usuario los necesite
 */
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch de filtros (se necesitan en /lotes)
    queryClient.prefetchQuery({
      queryKey: ['lotes-filtros-unified'],
      queryFn: async () => {
        const res = await fetch('/api/lotes/filtros');
        if (!res.ok) throw new Error('Error al cargar filtros');
        return res.json();
      },
      staleTime: 10 * 60 * 1000, // 10 minutos
    });

    // Prefetch de primera página de lotes (solo si el usuario está en dashboard)
    if (typeof window !== 'undefined' && window.location.pathname.includes('/lotes')) {
      queryClient.prefetchQuery({
        queryKey: ['lotes-list', { page: 1, limit: 8 }],
        queryFn: async () => {
          const res = await fetch('/api/lotes?limit=8&offset=0');
          if (!res.ok) throw new Error('Error al cargar lotes');
          return res.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutos
      });
    }
  }, [queryClient]);
}
