import { useState, useEffect } from 'react';

export interface DashboardStats {
  totalLots: number;
  lotsByStatus: Record<string, number>;
  lotsByNeighborhood: Array<{ name: string; total: number }>;
  currentQuarterSales: number;
  previousQuarterSales: number;
  quarterlySalesChange: number;
  monthlySales: Array<{ name: string; total: number }>;
}

export interface DashboardTableData {
  lotes: any[];
  total: number;
}

export interface DashboardData {
  stats: DashboardStats | null;
  tableData: DashboardTableData | null;
  users: any[];
  estados: string[];
  loading: boolean;
  error: string | null;
}

export const useDashboardOptimized = (
  agentFilter: string = 'todos',
  statusFilter: string = '',
  currentPage: number = 1,
  pageSize: number = 10,
  salesChartRange: string = '12m'
): DashboardData => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tableData, setTableData] = useState<DashboardTableData | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Cargar datos básicos (usuarios y estados) solo una vez
        const [usersRes, estadosRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/lotes/estados')
        ]);

        if (!usersRes.ok) throw new Error('Error al cargar usuarios');
        if (!estadosRes.ok) throw new Error('Error al cargar estados');

        const [usersData, estadosData] = await Promise.all([
          usersRes.json(),
          estadosRes.json()
        ]);

        setUsers(usersData.users || usersData || []);
        setEstados(estadosData.estados || []);

        // Cargar estadísticas del dashboard
        const statsParams = new URLSearchParams();
        if (agentFilter !== 'todos') statsParams.set('agent', agentFilter);
        if (statusFilter) statsParams.set('status', statusFilter);
        statsParams.set('salesChartRange', salesChartRange);

        const statsRes = await fetch(`/api/dashboard/stats?${statsParams.toString()}`);
        if (!statsRes.ok) throw new Error('Error al cargar estadísticas');

        const statsData = await statsRes.json();
        setStats(statsData);

        // Cargar datos de la tabla (paginados)
        const tableParams = new URLSearchParams();
        tableParams.set('limit', String(pageSize));
        tableParams.set('offset', String((currentPage - 1) * pageSize));
        if (agentFilter !== 'todos') tableParams.set('agent', agentFilter);
        if (statusFilter) tableParams.set('status', statusFilter);
        tableParams.set('salesChartRange', salesChartRange);

        const tableRes = await fetch(`/api/dashboard/lotes?${tableParams.toString()}`);
        if (!tableRes.ok) throw new Error('Error al cargar lotes');

        const tableData = await tableRes.json();
        setTableData(tableData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentFilter, statusFilter, currentPage, pageSize, salesChartRange]);

  return {
    stats,
    tableData,
    users,
    estados,
    loading,
    error
  };
}; 