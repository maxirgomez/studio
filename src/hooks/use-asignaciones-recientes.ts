import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';

const POLLING_INTERVAL = 30000; // 30 segundos (igual que solicitudes)

export function useAsignacionesRecientes() {
  const { user } = useUser();
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFunctionRef = useRef<(silent?: boolean) => Promise<void>>();

  const fetchAsignaciones = useCallback(async (silent = false) => {
    if (!user) {
      setAsignaciones([]);
      setLoading(false);
      return;
    }
    
    if (!silent) {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`/api/lotes/asignaciones-recientes?agente=${user.user}`);
      if (res.ok) {
        const data = await res.json();
        setAsignaciones(data.asignaciones || []);
      } else {
        setAsignaciones([]);
      }
    } catch (error) {
      console.error('Error al obtener asignaciones recientes:', error);
      setAsignaciones([]);
    }
    
    if (!silent) {
      setLoading(false);
    }
  }, [user]);

  // Mantener la referencia actualizada
  useEffect(() => {
    fetchFunctionRef.current = fetchAsignaciones;
  }, [fetchAsignaciones]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAsignaciones();
    }
  }, [fetchAsignaciones, mounted]);

  // Polling automático cada 60 segundos
  useEffect(() => {
    if (!mounted || !user) return;
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (fetchFunctionRef.current) {
        fetchFunctionRef.current(true);
      }
    }, POLLING_INTERVAL);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [mounted, user]);

  return {
    asignaciones,
    loading,
    refreshAsignaciones: fetchAsignaciones,
    count: mounted ? asignaciones.length : 0
  };
}

