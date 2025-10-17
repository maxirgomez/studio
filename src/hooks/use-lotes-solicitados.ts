import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useNotification } from '@/context/NotificationContext';

const POLLING_INTERVAL = 30000; // 30 segundos

export function useLotesSolicitados() {
  const { user } = useUser();
  const { refreshLotesSolicitados } = useNotification();
  const [lotesSolicitados, setLotesSolicitados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchFunctionRef = useRef<(silent?: boolean) => Promise<void>>();

  const fetchLotesSolicitados = useCallback(async (silent = false) => {
    if (!user) {
      setLotesSolicitados([]);
      setLoading(false);
      return;
    }
    
    if (!silent) {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`/api/lotes/solicitudes-pendientes?agente=${user.user}`);
      if (res.ok) {
        const data = await res.json();
        setLotesSolicitados(data.solicitudes || []);
      } else {
        setLotesSolicitados([]);
      }
    } catch (error) {
      console.error('Error al obtener lotes solicitados:', error);
      setLotesSolicitados([]);
    }
    
    if (!silent) {
      setLoading(false);
    }
  }, [user]);

  // Mantener la referencia actualizada
  useEffect(() => {
    fetchFunctionRef.current = fetchLotesSolicitados;
  }, [fetchLotesSolicitados]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchLotesSolicitados();
    }
  }, [fetchLotesSolicitados, mounted]);

  // Escuchar cambios en el contexto de notificaciones
  useEffect(() => {
    if (mounted && user) {
      fetchLotesSolicitados();
    }
  }, [refreshLotesSolicitados, user, fetchLotesSolicitados, mounted]);

  // Polling automático cada 30 segundos - SIN dependencia de fetchLotesSolicitados
  useEffect(() => {
    if (!mounted || !user) return;
    
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Crear nuevo intervalo usando la ref
    pollingIntervalRef.current = setInterval(() => {
      if (fetchFunctionRef.current) {
        fetchFunctionRef.current(true); // silent = true para no mostrar loading
      }
    }, POLLING_INTERVAL);
    
    // Limpiar al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [mounted, user]); // ✅ Solo depende de mounted y user

  return {
    lotesSolicitados,
    loading,
    refreshLotesSolicitados: fetchLotesSolicitados,
    count: mounted ? lotesSolicitados.length : 0
  };
}
