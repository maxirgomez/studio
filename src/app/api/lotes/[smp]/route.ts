import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Mismo mapeo que en route.ts principal
function mapLote(row: any) {
  return {
    address: row.direccion,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.superficie,
    status: row.estado,
    agent: { name: row.agente_nombre, initials: row.agente_iniciales },
    imageUrl: row.imagen_url,
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

export async function GET(req: Request, context: any) {
  console.log('context:', context);
  let smp: string | undefined;

  // Si context.params es una promesa, hay que await
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
  } else {
    smp = context?.params?.smp;
  }

  if (!smp) {
    // Alternativa: obtener el smp desde la URL
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    smp = parts[parts.length - 1] || parts[parts.length - 2];
  }
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    const lote = mapLote(rows[0]);
    return NextResponse.json({ lote });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
} 