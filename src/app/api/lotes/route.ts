import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function capitalizeWords(str: string) {
  return str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function normalizeBarrio(str: string) {
  return capitalizeWords(str.trim());
}

function mapLote(row: any) {
  return {
    address: row.dir_lote,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.m2aprox,
    status: row.estado,
    agent: { name: row.agente, initials: row.agente ? row.agente.slice(0,2).toUpperCase() : '' },
    imageUrl: row.foto_lote,
    aiHint: row.ai_hint,
    origen: row.origen,
    codigoUrbanistico: row.codigo_urbanistico,
    cpu: row.cpu,
    partida: row.partida,
    valorVentaUSD: row.valor_venta_usd,
    listingDate: row.fecha_publicacion,
    saleDate: row.fecha_venta,
    incidenciaUVA: row.incidencia_uva,
    fot: row.fot,
    alicuota: row.alicuota,
    m2Vendibles: row.m2_vendibles,
    incidenciaTasadaUSD: row.incidencia_tasada_usd,
    formaDePago: row.forma_pago,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Leer filtros
  const agent = searchParams.get('agent');
  const neighborhood = searchParams.get('neighborhood');
  const status = searchParams.get('status');
  const origen = searchParams.get('origen');
  const minArea = searchParams.get('minArea');
  const maxArea = searchParams.get('maxArea');

  // Construir query dinámica
  let whereClauses = [];
  let values: any[] = [];
  let idx = 1;

  if (agent) {
    const agents = agent.split(',').map(a => a.trim()).filter(Boolean);
    if (agents.length > 0) {
      whereClauses.push(`agente = ANY($${idx}::text[])`);
      values.push(agents);
      idx++;
    }
  }
  if (neighborhood) {
    // Normalizar barrios para que coincidan con la base (minúsculas y sin espacios extra)
    const neighborhoods = neighborhood.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    if (neighborhoods.length > 0) {
      whereClauses.push(`LOWER(TRIM(barrio)) = ANY($${idx}::text[])`);
      values.push(neighborhoods);
      idx++;
    }
  }
  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      whereClauses.push(`estado = ANY($${idx}::text[])`);
      values.push(statuses);
      idx++;
    }
  }
  if (origen) {
    const origens = origen.split(',').map(o => o.trim()).filter(Boolean);
    if (origens.length > 0) {
      whereClauses.push(`origen = ANY($${idx}::text[])`);
      values.push(origens);
      idx++;
    }
  }
  if (minArea) {
    whereClauses.push(`m2aprox >= $${idx}`);
    values.push(Number(minArea));
    idx++;
  }
  if (maxArea) {
    whereClauses.push(`m2aprox <= $${idx}`);
    values.push(Number(maxArea));
    idx++;
  }

  let where = '';
  if (whereClauses.length > 0) {
    where = 'WHERE ' + whereClauses.join(' AND ');
  }

  // Query para el total
  const countQuery = `SELECT COUNT(*) FROM public.prefapp_lotes ${where}`;

  // Agregar paginación
  const pagValues = [...values, limit, offset];
  const query = `SELECT * FROM public.prefapp_lotes ${where} ORDER BY gid LIMIT $${idx} OFFSET $${idx + 1}`;

  try {
    // Obtener el total
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    // Obtener los lotes paginados
    const { rows } = await pool.query(query, pagValues);
    const lotes = rows.map(mapLote);
    return NextResponse.json({ lotes, total });
  } catch (error) {
    console.error('Error en /api/lotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener los lotes', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Nuevo endpoint para barrios únicos
export async function GET_BARRIOS() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT barrio FROM public.prefapp_lotes WHERE barrio IS NOT NULL ORDER BY barrio');
    const barrios = rows.map(r => r.barrio);
    return NextResponse.json({ barrios });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener barrios', details: (error as Error).message }, { status: 500 });
  }
} 