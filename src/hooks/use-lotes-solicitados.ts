import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import { useNotification } from '@/context/NotificationContext';

export function useLotesSolicitados() {
  const { user } = useUser();
  const { refreshLotesSolicitados } = useNotification();
  const [lotesSolicitados, setLotesSolicitados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchLotesSolicitados = useCallback(async () => {
    if (!user) {
      setLotesSolicitados([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
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
    setLoading(false);
  }, [user]);

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

  return {
    lotesSolicitados,
    loading,
    refreshLotesSolicitados: fetchLotesSolicitados,
    count: mounted ? lotesSolicitados.length : 0
  };
}
