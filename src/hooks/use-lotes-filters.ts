import { useQuery } from '@tanstack/react-query';

/**
 * Hook para obtener opciones de filtros (barrios, estados, agentes, etc.)
 * con caché de larga duración (estos datos cambian raramente)
 */

export function useBarrios() {
  return useQuery({
    queryKey: ['lotes-barrios'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/barrios');
      if (!res.ok) throw new Error('Error al cargar barrios');
      const data = await res.json();
      return data.barrios || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - datos raramente cambian
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useEstados() {
  return useQuery({
    queryKey: ['lotes-estados'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/estados');
      if (!res.ok) throw new Error('Error al cargar estados');
      const data = await res.json();
      return data.estados || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useOrigenes() {
  return useQuery({
    queryKey: ['lotes-origenes'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/origenes');
      if (!res.ok) throw new Error('Error al cargar orígenes');
      const data = await res.json();
      return data.origenes || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useTipos() {
  return useQuery({
    queryKey: ['lotes-tipos'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/tipos');
      if (!res.ok) throw new Error('Error al cargar tipos');
      const data = await res.json();
      return data.tipos || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAgentes() {
  return useQuery({
    queryKey: ['lotes-agentes'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/agentes');
      if (!res.ok) throw new Error('Error al cargar agentes');
      const data = await res.json();
      return data.agentes || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - puede cambiar más frecuentemente
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAreaRange() {
  return useQuery({
    queryKey: ['lotes-area-range'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/area-range');
      if (!res.ok) throw new Error('Error al cargar rango de área');
      const data = await res.json();
      return {
        minArea: data.minArea || 0,
        maxArea: data.maxArea || 1000,
      };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useFrenteRange() {
  return useQuery({
    queryKey: ['lotes-frente-range'],
    queryFn: async () => {
      const res = await fetch('/api/lotes/frente-range');
      if (!res.ok) throw new Error('Error al cargar rango de frente');
      const data = await res.json();
      return {
        minFrente: data.minFrente || 0,
        maxFrente: data.maxFrente || 50,
      };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

