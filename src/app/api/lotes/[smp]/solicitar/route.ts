import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request, context: any) {
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
    smp = parts[parts.length - 2]; // Obtener smp desde la URL
  }
  
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { usuarioSolicitante, motivo } = body;
    
    if (!usuarioSolicitante) {
      return NextResponse.json({ error: 'Usuario solicitante requerido' }, { status: 400 });
    }

    // Verificar que el lote existe y obtener agente actual
    const { rows } = await pool.query(
      `SELECT agente, direccion FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const agenteActual = rows[0].agente;
    const direccionLote = rows[0].direccion;
    
    // Verificar que no sea el mismo usuario
    if (agenteActual === usuarioSolicitante) {
      return NextResponse.json({ error: 'No puedes solicitar tu propio lote' }, { status: 400 });
    }
    
    // Verificar que no haya una solicitud pendiente del mismo usuario
    const { rows: estadoRows } = await pool.query(
      `SELECT estado FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    const estadoActual = estadoRows[0]?.estado;
    if (estadoActual?.includes(`Solicitado por ${usuarioSolicitante}`)) {
      return NextResponse.json({ error: 'Ya tienes una solicitud pendiente para este lote' }, { status: 400 });
    }
    
    // Cambiar estado a solicitud pendiente
    const nuevoEstado = `Solicitado por ${usuarioSolicitante}`;
    await pool.query(
      `UPDATE public.prefapp_lotes 
       SET estado = $1 
       WHERE smp = $2`,
      [nuevoEstado, smp]
    );
    
    // Crear nota de seguimiento
    await pool.query(
      `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
       VALUES ($1, $2, $3, NOW())`,
      [smp, usuarioSolicitante, `Solicita transferencia del lote "${direccionLote}". Motivo: ${motivo || 'No especificado'}`]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Solicitud enviada correctamente',
      nuevoEstado,
      agenteActual 
    });
    
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json({ 
      error: 'Error al procesar solicitud', 
      details: (error as Error).message 
    }, { status: 500 });
  }
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
    smp = parts[parts.length - 2];
  }
  
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  try {
    // Obtener información de solicitudes para este lote
    const { rows } = await pool.query(
      `SELECT estado, agente, direccion FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = rows[0];
    const estado = lote.estado;
    
    // Verificar si hay una solicitud pendiente
    const tieneSolicitud = estado?.includes('Solicitado por');
    const usuarioSolicitante = tieneSolicitud ? estado.replace('Solicitado por ', '') : null;
    
    return NextResponse.json({
      smp,
      direccion: lote.direccion,
      agente: lote.agente,
      estado,
      tieneSolicitud,
      usuarioSolicitante
    });
    
  } catch (error) {
    console.error('Error al obtener información de solicitud:', error);
    return NextResponse.json({ 
      error: 'Error al obtener información de solicitud', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}