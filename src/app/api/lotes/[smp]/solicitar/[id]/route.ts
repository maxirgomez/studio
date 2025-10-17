import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: Request, context: any) {
  let smp: string | undefined;
  let id: string | undefined;
  
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
    id = awaitedParams?.id;
  } else {
    smp = context?.params?.smp;
    id = context?.params?.id;
  }
  
  if (!smp || !id) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    smp = parts[parts.length - 3];
    id = parts[parts.length - 1];
  }
  
  if (!smp || !id) {
    return NextResponse.json({ error: 'SMP o ID no especificado' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { accion, agenteActual, nuevoAgente, motivo } = body; // accion: 'aceptar' | 'rechazar'
    
    if (!accion || !agenteActual) {
      return NextResponse.json({ error: 'Acción y agente actual requeridos' }, { status: 400 });
    }
    
    // Verificar que el lote existe y obtener información actual
    const { rows } = await pool.query(
      `SELECT agente, estado, direccion FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = rows[0];
    const agenteLote = lote.agente;
    const estadoActual = lote.estado;
    const direccionLote = lote.direccion;
    
    // Verificar que el agente actual tiene permisos para responder
    if (agenteLote !== agenteActual) {
      return NextResponse.json({ 
        error: 'No tienes permisos para responder esta solicitud' 
      }, { status: 403 });
    }
    
    // Verificar que hay una solicitud pendiente
    if (!estadoActual?.includes('Solicitado por')) {
      return NextResponse.json({ 
        error: 'No hay una solicitud pendiente para este lote' 
      }, { status: 400 });
    }
    
    // Extraer el usuario solicitante del estado
    const usuarioSolicitante = estadoActual.replace('Solicitado por ', '');
    
    if (accion === 'aceptar') {
      if (!nuevoAgente) {
        return NextResponse.json({ error: 'Nuevo agente requerido para aceptar' }, { status: 400 });
      }
      
      // Cambiar estado a "En transferencia" y actualizar agente
      await pool.query(
        `UPDATE public.prefapp_lotes 
         SET estado = 'En transferencia', agente = $1 
         WHERE smp = $2`,
        [nuevoAgente, smp]
      );
      
      // Crear nota de transferencia aceptada
      await pool.query(
        `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
         VALUES ($1, $2, $3, NOW())`,
        [smp, agenteActual, `Transferencia aceptada. Lote "${direccionLote}" asignado a ${nuevoAgente}`]
      );
      
      // Crear nota para el nuevo agente
      await pool.query(
        `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
         VALUES ($1, $2, $3, NOW())`,
        [smp, nuevoAgente, `Lote "${direccionLote}" transferido desde ${agenteActual}`]
      );
      
      // Después de un tiempo, cambiar a estado normal (simulamos proceso)
      setTimeout(async () => {
        try {
          await pool.query(
            `UPDATE public.prefapp_lotes 
             SET estado = 'Disponible' 
             WHERE smp = $1 AND estado = 'En transferencia'`,
            [smp]
          );
          
          // Crear nota de transferencia completada
          await pool.query(
            `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
             VALUES ($1, $2, $3, NOW())`,
            [smp, nuevoAgente, `Transferencia completada. Lote "${direccionLote}" ahora está disponible.`]
          );
        } catch (error) {
          console.error('Error al completar transferencia:', error);
        }
      }, 10000); // 10 segundos para simular proceso
      
      return NextResponse.json({ 
        success: true, 
        message: 'Solicitud aceptada. Transferencia en proceso.',
        nuevoAgente,
        estadoAnterior: estadoActual
      });
      
    } else if (accion === 'rechazar') {
      // Volver al estado anterior (asumimos que era 'Disponible')
      await pool.query(
        `UPDATE public.prefapp_lotes 
         SET estado = 'Disponible' 
         WHERE smp = $1`,
        [smp]
      );
      
      // Crear nota de rechazo
      await pool.query(
        `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
         VALUES ($1, $2, $3, NOW())`,
        [smp, agenteActual, `Solicitud de transferencia rechazada para "${direccionLote}"`]
      );
      
      // Crear nota para el usuario solicitante
      await pool.query(
        `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
         VALUES ($1, $2, $3, NOW())`,
        [smp, usuarioSolicitante, `Tu solicitud para el lote "${direccionLote}" fue rechazada por ${agenteActual}.`]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'Solicitud rechazada.',
        estadoAnterior: estadoActual
      });
    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error al procesar respuesta de solicitud:', error);
    return NextResponse.json({ 
      error: 'Error al procesar respuesta', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(req: Request, context: any) {
  let smp: string | undefined;
  let id: string | undefined;
  
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
    id = awaitedParams?.id;
  } else {
    smp = context?.params?.smp;
    id = context?.params?.id;
  }
  
  if (!smp || !id) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    smp = parts[parts.length - 3];
    id = parts[parts.length - 1];
  }
  
  if (!smp || !id) {
    return NextResponse.json({ error: 'SMP o ID no especificado' }, { status: 400 });
  }

  try {
    // Obtener información de la solicitud específica
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
      id,
      direccion: lote.direccion,
      agente: lote.agente,
      estado,
      tieneSolicitud,
      usuarioSolicitante,
      puedeResponder: lote.agente === id // El ID representa al agente actual
    });
    
  } catch (error) {
    console.error('Error al obtener información de solicitud:', error);
    return NextResponse.json({ 
      error: 'Error al obtener información de solicitud', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}