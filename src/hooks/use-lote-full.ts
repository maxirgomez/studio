import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface LoteFull {
  lote: any;
  agenteUsuario: any;
  notas: any[];
  frentes: any[];
  superficieParcela: number | null;
  isEsquina: boolean;
  docs: any[];
}

/**
 * Hook personalizado para obtener datos completos de un lote con caché inteligente
 * 
 * Características:
 * - ✅ Caché de 5 minutos (navegación rápida)
 * - ✅ Revalidación automática al montar
 * - ✅ Manejo de estados de carga y error
 * - ✅ Invalidación manual disponible
 */
export function useLoteFull(smp: string) {
  const queryClient = useQueryClient();

  const query = useQuery<LoteFull>({
    queryKey: ['lote', smp], // Clave única para este lote
    queryFn: async () => {
      const res = await fetch(`/api/lotes/${smp}/full`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Lote no encontrado');
        }
        throw new Error('Error al obtener el lote');
      }
      return res.json();
    },
    // Configuración de caché
    staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - garbage collection time (antes cacheTime)
    refetchOnMount: 'always', // Siempre revalidar (para asegurar datos frescos)
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    retry: 1, // Solo 1 reintento
  });

  /**
   * Función para invalidar el caché de este lote específico
   * Útil después de editar el lote
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['lote', smp] });
  };

  /**
   * Función para invalidar TODO el caché de lotes
   * Útil después de operaciones que afectan múltiples lotes
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['lote'] });
  };

  /**
   * Función para actualizar el caché manualmente
   * Útil para optimistic updates
   */
  const updateCache = (updater: (old: LoteFull | undefined) => LoteFull) => {
    queryClient.setQueryData(['lote', smp], updater);
  };

  return {
    // Datos
    data: query.data,
    lote: query.data ? query.data.lote : null,
    agenteUsuario: query.data ? query.data.agenteUsuario : null,
    notas: query.data ? query.data.notas : [],
    frentes: query.data ? query.data.frentes : [],
    superficieParcela: query.data ? query.data.superficieParcela : null,
    isEsquina: query.data ? query.data.isEsquina : false,
    docs: query.data ? query.data.docs : [],
    
    // Estados
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching, // True cuando está refetcheando en background
    
    // Funciones de utilidad
    invalidate,
    invalidateAll,
    updateCache,
    refetch: query.refetch,
  };
}

/**
 * Hook para invalidar el caché sin necesidad de estar en el componente del lote
 * Útil para llamar desde el formulario de edición
 */
export function useInvalidateLote() {
  const queryClient = useQueryClient();

  return {
    invalidateLote: (smp: string) => {
      queryClient.invalidateQueries({ queryKey: ['lote', smp] });
    },
    invalidateAllLotes: () => {
      queryClient.invalidateQueries({ queryKey: ['lote'] });
    },
  };
}

