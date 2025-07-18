import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentFilter = searchParams.get('agent') || 'todos';
    const statusFilter = searchParams.get('status') || '';

    console.log('Dashboard stats params:', { agentFilter, statusFilter });

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

    console.log('Base where clause:', baseWhereClause);
    console.log('Base values:', baseValues);

    // Consultas simplificadas y más robustas
    const queries = [
      // Total de lotes
      pool.query(`SELECT COUNT(*) as total FROM public.prefapp_lotes ${baseWhereClause}`, baseValues),
      
      // Lotes por estado
      pool.query(`
        SELECT estado, COUNT(*) as count 
        FROM public.prefapp_lotes ${baseWhereClause}
        GROUP BY estado 
        ORDER BY count DESC
      `, baseValues),
      
      // Lotes por barrio
      pool.query(`
        SELECT barrio as name, COUNT(*) as total 
        FROM public.prefapp_lotes ${baseWhereClause} ${baseWhereClause ? 'AND' : 'WHERE'} barrio IS NOT NULL
        GROUP BY barrio 
        ORDER BY total DESC
        LIMIT 20
      `, baseValues),
      
      // Ventas del trimestre actual
      pool.query(`
        SELECT COUNT(*) as count
        FROM public.prefapp_lotes 
        ${baseWhereClause} ${baseWhereClause ? 'AND' : 'WHERE'} estado = 'Vendido' 
        AND fventa IS NOT NULL
        AND fventa >= DATE_TRUNC('quarter', CURRENT_DATE)
        AND fventa < DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months'
      `, baseValues),
      
      // Ventas del trimestre anterior
      pool.query(`
        SELECT COUNT(*) as count
        FROM public.prefapp_lotes 
        ${baseWhereClause} ${baseWhereClause ? 'AND' : 'WHERE'} estado = 'Vendido' 
        AND fventa IS NOT NULL
        AND fventa >= DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months'
        AND fventa < DATE_TRUNC('quarter', CURRENT_DATE)
      `, baseValues),
      
      // Ventas por mes (últimos 12 meses)
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', fventa), 'YYYY-MM') as month,
          COUNT(*) as total
        FROM public.prefapp_lotes 
        ${baseWhereClause} ${baseWhereClause ? 'AND' : 'WHERE'} estado = 'Vendido' 
        AND fventa IS NOT NULL
        AND fventa >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', fventa)
        ORDER BY month
      `, baseValues)
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