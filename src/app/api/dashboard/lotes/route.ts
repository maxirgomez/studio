import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function mapLoteForDashboard(row: any, agenteUsuario: any = null) {
  return {
    address: row.dir_lote,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.m2aprox,
    status: row.estado,
    agent: {
      user: row.agente,
      nombre: agenteUsuario?.nombre || null,
      apellido: agenteUsuario?.apellido || null,
    },
    valorVentaUSD: row.vventa,
    origen: row.origen,
    listingDate: null, // No tenemos fecha de publicación
    saleDate: row.fventa,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const agentFilter = searchParams.get('agent') || 'todos';
    const statusFilter = searchParams.get('status') || '';
    const salesChartRange = searchParams.get('salesChartRange') || '12m';

    // Calcular la fecha de corte según el rango
    const getDateCutoff = (range: string) => {
      const months = range === "12m" ? 12 : range === "6m" ? 6 : 3;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      return cutoffDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    const dateCutoff = getDateCutoff(salesChartRange);

    // Construir filtros
    let whereClauses = [];
    let values: any[] = [];
    let idx = 1;

    if (agentFilter !== 'todos') {
      whereClauses.push(`agente = $${idx}`);
      values.push(agentFilter);
      idx++;
    }

    if (statusFilter) {
      // Normalizar el filtro de estado para que coincida con la BD
      let normalizedStatusFilter = statusFilter;
      if (statusFilter === 'Tomar Acción') {
        normalizedStatusFilter = 'Tomar acción';
      } else if (statusFilter === 'Tasación') {
        normalizedStatusFilter = 'Tasación';
      }
      
      whereClauses.push(`estado = $${idx}`);
      values.push(normalizedStatusFilter);
      idx++;
    }

    // Agregar filtro de fecha (opcional) - usando una aproximación más segura
    // Por ahora no filtramos por fecha hasta confirmar qué columnas están disponibles
    // TODO: Implementar filtro de fecha cuando se confirme la estructura de la BD

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query para el total
    const countQuery = `SELECT COUNT(*) FROM public.prefapp_lotes ${whereClause}`;
    
    // Query para los lotes paginados (solo campos necesarios)
    const lotesQuery = `
      SELECT 
        smp, dir_lote, barrio, m2aprox, estado, agente, 
        vventa, origen, fventa
      FROM public.prefapp_lotes 
      ${whereClause}
      ORDER BY gid 
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const pagValues = [...values, limit, offset];

    // Ejecutar queries en paralelo
    const [countResult, lotesResult] = await Promise.all([
      pool.query(countQuery, values),
      pool.query(lotesQuery, pagValues)
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    // Obtener info de agentes solo para los lotes de esta página
    const agentesEnPagina = [...new Set(lotesResult.rows.map(row => row.agente).filter(Boolean))];
    let agentesInfo: Record<string, any> = {};
    
    if (agentesEnPagina.length > 0) {
      const placeholders = agentesEnPagina.map((_, i) => `$${i + 1}`).join(',');
      const { rows: agentesRows } = await pool.query(`
        SELECT user, nombre, apellido
        FROM public.prefapp_users 
        WHERE user = ANY($1::text[])
      `, [agentesEnPagina]);
      
      agentesRows.forEach(u => {
        agentesInfo[u.user.toLowerCase()] = u;
      });
    }

    // Mapear lotes
    const lotes = lotesResult.rows.map(row => {
      const agenteUsuario = agentesInfo[(row.agente || '').toLowerCase()] || null;
      return mapLoteForDashboard(row, agenteUsuario);
    });

    return NextResponse.json({ lotes, total });

  } catch (error) {
    console.error('Error en dashboard lotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener lotes', details: (error as Error).message },
      { status: 500 }
    );
  }
} 