import { useQuery } from '@tanstack/react-query';

export interface LotesFilterData {
  barrios: string[];
  estados: string[];
  origenes: string[];
  tipos: string[];
  agentes: {
    user: string;
    nombre: string;
    apellido: string;
    foto_perfil: string | null;
    iniciales: string;
  }[];
  areaRange: {
    minArea: number;
    maxArea: number;
  };
  frenteRange: {
    minFrente: number;
    maxFrente: number;
  };
}

/**
 * Hook optimizado que carga TODOS los filtros en una sola request
 * Reduce latencia de 7 requests a 1 sola request
 */
export function useLotesFiltersUnified() {
  return useQuery<LotesFilterData>({
    queryKey: ['lotes-filtros-unified'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/filtros');
      if (!res.ok) {
        throw new Error('Error al cargar filtros');
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - los filtros cambian raramente
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
