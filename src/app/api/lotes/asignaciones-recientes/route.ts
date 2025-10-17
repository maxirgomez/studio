import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agente = url.searchParams.get('agente');
    
    if (!agente) {
      return NextResponse.json({ error: 'Agente requerido' }, { status: 400 });
    }

    // Buscar notas recientes (últimos 7 días) que indiquen transferencia
    const { rows } = await pool.query(`
      SELECT 
        n.smp,
        n.notas,
        n.fecha,
        l.direccion,
        l.barrio,
        l.m2aprox,
        l.vventa,
        l.estado
      FROM public.prefapp_notas n
      INNER JOIN public.prefapp_lotes l ON n.smp = l.smp
      WHERE n.agente = $1
        AND n.notas LIKE '%transferido desde%'
        AND n.fecha >= NOW() - INTERVAL '7 days'
      ORDER BY n.fecha DESC
    `, [agente]);
    
    // Parsear las notas para extraer el agente que transfirió
    const asignaciones = rows.map(row => {
      // Extraer "transferido desde {agente}"
      const match = row.notas.match(/transferido desde (\w+)/i);
      const agenteAnterior = match ? match[1] : 'Desconocido';
      
      return {
        smp: row.smp,
        direccion: row.direccion,
        barrio: row.barrio,
        m2aprox: row.m2aprox,
        vventa: row.vventa,
        estado: row.estado,
        fecha: row.fecha,
        agenteAnterior,
        mensaje: row.notas
      };
    });
    
    // Obtener información de los agentes anteriores
    const agentesAnteriores = [...new Set(asignaciones.map(a => a.agenteAnterior))];
    let agentesInfo: Record<string, any> = {};
    
    if (agentesAnteriores.length > 0) {
      const { rows: agentesRows } = await pool.query(`
        SELECT user, nombre, apellido, foto_perfil
        FROM public.prefapp_users 
        WHERE user = ANY($1::text[])
      `, [agentesAnteriores]);
      
      agentesRows.forEach(u => {
        agentesInfo[u.user] = {
          user: u.user,
          nombre: u.nombre,
          apellido: u.apellido,
          foto_perfil: u.foto_perfil,
          iniciales: `${(u.nombre?.[0] || '').toUpperCase()}${(u.apellido?.[0] || '').toUpperCase()}`
        };
      });
    }
    
    // Agregar info de agentes
    const asignacionesConInfo = asignaciones.map(asignacion => ({
      ...asignacion,
      agenteInfo: agentesInfo[asignacion.agenteAnterior] || null
    }));
    
    return NextResponse.json({ 
      asignaciones: asignacionesConInfo,
      total: asignacionesConInfo.length
    });
    
  } catch (error) {
    console.error('Error al obtener asignaciones recientes:', error);
    return NextResponse.json({ 
      error: 'Error al obtener asignaciones recientes', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

