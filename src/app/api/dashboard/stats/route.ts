import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentFilter = searchParams.get('agent') || 'todos';
    const statusFilter = searchParams.get('status') || '';
    const salesChartRange = searchParams.get('salesChartRange') || '12m';

    console.log('Dashboard stats params:', { agentFilter, statusFilter, salesChartRange });

    // Verificar estructura de la tabla para columnas de fecha
    try {
      const { rows: columnInfo } = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'prefapp_lotes' 
        AND table_schema = 'public'
        AND (data_type LIKE '%date%' OR data_type LIKE '%timestamp%')
        ORDER BY column_name
      `);
      console.log('Available date columns:', columnInfo);
    } catch (error) {
      console.log('Could not check table structure:', error);
    }

    // Calcular la fecha de corte según el rango
    const getDateCutoff = (range: string) => {
      const months = range === "12m" ? 12 : range === "6m" ? 6 : 3;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      return cutoffDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    const dateCutoff = getDateCutoff(salesChartRange);

    // Construir filtros base
    let baseWhereClause = '';
    let baseValues: any[] = [];
    let paramIndex = 1;

    if (agentFilter !== 'todos') {
      baseWhereClause = `WHERE agente = $${paramIndex}`;
      baseValues.push(agentFilter);
      paramIndex++;
    }

    if (statusFilter) {
      if (baseWhereClause) {
        baseWhereClause += ` AND estado = $${paramIndex}`;
      } else {
        baseWhereClause = `WHERE estado = $${paramIndex}`;
      }
      baseValues.push(statusFilter);
      paramIndex++;
    }

    // Agregar filtro de fecha (opcional) - usando una aproximación más segura
    // Por ahora no filtramos por fecha hasta confirmar qué columnas están disponibles
    // TODO: Implementar filtro de fecha cuando se confirme la estructura de la BD
    
    console.log('Base where clause:', baseWhereClause);
    console.log('Base values:', baseValues);
    console.log('Date cutoff:', dateCutoff);

    // Consultas simplificadas y más robustas
    const queries = [
      // Total de lotes (SIEMPRE total global, sin filtro de estado)
      pool.query(`
        SELECT COUNT(*) as total 
        FROM public.prefapp_lotes 
        WHERE fventa IS NOT NULL
        AND fventa::date >= CURRENT_DATE - INTERVAL '${salesChartRange === "12m" ? "12" : salesChartRange === "6m" ? "6" : "3"} months'
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
      `, agentFilter !== 'todos' ? [agentFilter] : []),
      
      // Lotes por estado (SIEMPRE total global, sin filtro de estado)
      pool.query(`
        SELECT estado, COUNT(*) as count 
        FROM public.prefapp_lotes 
        WHERE fventa IS NOT NULL
        AND fventa::date >= CURRENT_DATE - INTERVAL '${salesChartRange === "12m" ? "12" : salesChartRange === "6m" ? "6" : "3"} months'
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
        GROUP BY estado 
        ORDER BY count DESC
      `, agentFilter !== 'todos' ? [agentFilter] : []),
      
      // Lotes por barrio (con filtro de fecha y estado)
      pool.query(`
        SELECT barrio as name, COUNT(*) as total 
        FROM public.prefapp_lotes 
        WHERE fventa IS NOT NULL
        AND fventa::date >= CURRENT_DATE - INTERVAL '${salesChartRange === "12m" ? "12" : salesChartRange === "6m" ? "6" : "3"} months'
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
        ${statusFilter ? `AND estado = $${agentFilter !== 'todos' ? '2' : '1'}` : ''}
        AND barrio IS NOT NULL
        GROUP BY barrio 
        ORDER BY total DESC
        LIMIT 20
      `, statusFilter ? (agentFilter !== 'todos' ? [agentFilter, statusFilter] : [statusFilter]) : (agentFilter !== 'todos' ? [agentFilter] : [])),
      
      // Ventas del trimestre actual
      pool.query(`
        SELECT COUNT(*) as count
        FROM public.prefapp_lotes 
        WHERE estado = 'Vendido' 
        AND fventa IS NOT NULL
        AND fventa::date >= DATE_TRUNC('quarter', CURRENT_DATE)
        AND fventa::date < DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
        ${statusFilter ? `AND estado = $${agentFilter !== 'todos' ? '2' : '1'}` : ''}
      `, statusFilter ? (agentFilter !== 'todos' ? [agentFilter, statusFilter] : [statusFilter]) : (agentFilter !== 'todos' ? [agentFilter] : [])),
      
      // Ventas del trimestre anterior
      pool.query(`
        SELECT COUNT(*) as count
        FROM public.prefapp_lotes 
        WHERE estado = 'Vendido' 
        AND fventa IS NOT NULL
        AND fventa::date >= DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months'
        AND fventa::date < DATE_TRUNC('quarter', CURRENT_DATE)
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
        ${statusFilter ? `AND estado = $${agentFilter !== 'todos' ? '2' : '1'}` : ''}
      `, statusFilter ? (agentFilter !== 'todos' ? [agentFilter, statusFilter] : [statusFilter]) : (agentFilter !== 'todos' ? [agentFilter] : [])),
      
      // Ventas por mes (dinámico según el rango seleccionado)
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', fventa), 'YYYY-MM') as month,
          COUNT(*) as total
        FROM public.prefapp_lotes 
        WHERE fventa IS NOT NULL
        AND fventa::date >= CURRENT_DATE - INTERVAL '${salesChartRange === "12m" ? "12" : salesChartRange === "6m" ? "6" : "3"} months'
        AND estado = 'Vendido'
        ${agentFilter !== 'todos' ? 'AND agente = $1' : ''}
        ${statusFilter ? `AND estado = $${agentFilter !== 'todos' ? '2' : '1'}` : ''}
        GROUP BY DATE_TRUNC('month', fventa)
        ORDER BY month
      `, statusFilter ? (agentFilter !== 'todos' ? [agentFilter, statusFilter] : [statusFilter]) : (agentFilter !== 'todos' ? [agentFilter] : []))
    ];

    console.log('Executing queries...');
    const [
      totalResult,
      statusResult,
      barriosResult,
      currentQuarterResult,
      previousQuarterResult,
      monthlySalesResult
    ] = await Promise.all(queries);

    console.log('Queries completed successfully');

    // Procesar resultados con validación
    const totalLots = parseInt(totalResult.rows[0]?.total || '0');
    
    const lotsByStatus = statusResult.rows.reduce((acc: any, row: any) => {
      if (row.estado) {
        acc[row.estado] = parseInt(row.count) || 0;
      }
      return acc;
    }, {});
    
    const lotsByNeighborhood = barriosResult.rows.map((row: any) => ({
      name: row.name || 'Sin barrio',
      total: parseInt(row.total) || 0
    }));

    const currentQuarterSales = parseInt(currentQuarterResult.rows[0]?.count || '0');
    const previousQuarterSales = parseInt(previousQuarterResult.rows[0]?.count || '0');
    const quarterlySalesChange = previousQuarterSales > 0 
      ? ((currentQuarterSales - previousQuarterSales) / previousQuarterSales) * 100 
      : currentQuarterSales > 0 ? 100 : 0;

    // Procesar ventas mensuales con validación
    const monthlySales = monthlySalesResult.rows.map((row: any) => {
      try {
        const monthName = new Date(row.month + '-01').toLocaleDateString('es', { month: 'short' });
        return {
          name: monthName,
          total: parseInt(row.total) || 0
        };
      } catch (error) {
        console.error('Error processing month:', row.month, error);
        return {
          name: row.month || 'Unknown',
          total: parseInt(row.total) || 0
        };
      }
    });

    const result = {
      totalLots,
      lotsByStatus,
      lotsByNeighborhood,
      currentQuarterSales,
      previousQuarterSales,
      quarterlySalesChange,
      monthlySales
    };

    console.log('Dashboard stats result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', details: (error as Error).message },
      { status: 500 }
    );
  }
} 