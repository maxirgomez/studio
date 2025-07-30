import { useState, useEffect } from 'react';

export interface DashboardData {
  listings: any[];
  users: any[];
  barrios: string[];
  estados: string[];
  origenes: string[];
  loading: boolean;
  error: string | null;
}

export interface StatusStyles {
  [key: string]: {
    backgroundColor: string;
    color: string;
  };
}

export { getStatusStyles } from '../lib/status-colors';

export const useDashboardData = (): DashboardData => {
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [origenes, setOrigenes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [listingsRes, usersRes, barriosRes, estadosRes, origenesRes] = await Promise.all([
          fetch('/api/lotes?limit=999999'), // Get ALL listings for dashboard (no limit)
          fetch('/api/users'),
          fetch('/api/lotes/barrios'),
          fetch('/api/lotes/estados'),
          fetch('/api/lotes/origenes')
        ]);

        // Check for errors
        if (!listingsRes.ok) throw new Error('Error al cargar lotes');
        if (!usersRes.ok) throw new Error('Error al cargar usuarios');
        if (!barriosRes.ok) throw new Error('Error al cargar barrios');
        if (!estadosRes.ok) throw new Error('Error al cargar estados');
        if (!origenesRes.ok) throw new Error('Error al cargar orígenes');

        // Parse responses
        const [listingsData, usersData, barriosData, estadosData, origenesData] = await Promise.all([
          listingsRes.json(),
          usersRes.json(),
          barriosRes.json(),
          estadosRes.json(),
          origenesRes.json()
        ]);

        // Transform listings data to match expected format
        const transformedListings = (listingsData.lotes || []).map((lote: any) => ({
          ...lote,
          address: lote.address || lote.dir_lote || `${lote.frente} ${lote.num_dom || ''}`.trim(),
          neighborhood: lote.neighborhood || lote.barrio,
          area: lote.area || 0,
          valorVentaUSD: lote.valorVentaUSD || 0,
          status: lote.status || lote.estado, // Usar 'status' mapeado o 'estado' original
          agent: lote.agent || { name: 'Sin asignar' },
          origen: lote.origen || 'Sin origen',
          smp: lote.smp,
          listingDate: lote.listingDate ? new Date(lote.listingDate) : null,
          saleDate: lote.saleDate ? new Date(lote.saleDate) : null,
        }));

        setListings(transformedListings);
        setUsers(usersData.users || usersData || []);
        setBarrios(barriosData.barrios || []);
        setEstados(estadosData.estados || []);
        setOrigenes(origenesData.origenes || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    listings,
    users,
    barrios,
    estados,
    origenes,
    loading,
    error
  };
}; 