import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function mapLote(row: any) {
  return {
    address: row.direccion,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.superficie,
    status: row.estado,
    agente: row.agente, // user del agente
    foto_lote: row.foto_lote,
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
    propietario: row.propietario,
    direccion: row.direccion,
    localidad: row.localidad,
    cp: row.cp,
    direccionalt: row.direccionalt,
    fallecido: row.fallecido,
    mail: row.mail,
    tel1: row.tel1,
    tel2: row.tel2,
    tel3: row.tel3,
    cel1: row.cel1,
    cel2: row.cel2,
    cel3: row.cel3,
  };
}

export async function GET(req: Request, context: any) {
  let smp: string | undefined;
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
  } else {
    smp = context?.params?.smp;
  }
  if (!smp) {
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
    // Buscar usuario (agente) asociado
    let agenteUsuario = null;
    if (lote.agente) {
      const { rows: userRows } = await pool.query(
        `SELECT user, nombre, apellido, foto_perfil FROM public.prefapp_users WHERE LOWER(user) = $1 LIMIT 1`,
        [lote.agente.toLowerCase()]
      );
      if (userRows.length > 0) {
        const user = userRows[0];
        agenteUsuario = {
          user: user.user,
          nombre: user.nombre,
          apellido: user.apellido,
          foto_perfil: user.foto_perfil,
          iniciales: `${(user.nombre?.[0] || '').toUpperCase()}${(user.apellido?.[0] || '').toUpperCase()}`,
        };
      }
    }
    return NextResponse.json({ lote, agenteUsuario });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
} 