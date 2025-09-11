import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const agente = url.searchParams.get('agente');
    
    if (!agente) {
      return NextResponse.json({ error: 'Agente requerido' }, { status: 400 });
    }

    // Buscar lotes con estado "Solicitado por [usuario]" donde el agente actual es el solicitado
    const { rows } = await pool.query(`
      SELECT 
        smp, 
        direccion, 
        barrio, 
        estado, 
        agente,
        m2aprox,
        vventa
      FROM public.prefapp_lotes 
      WHERE estado LIKE $1
      ORDER BY smp
    `, [`Solicitado por %`]);
    
    // Filtrar solo las solicitudes dirigidas al agente actual
    const solicitudesParaAgente = rows.filter(row => {
      const estado = row.estado;
      if (!estado?.includes('Solicitado por')) return false;
      
      // Extraer el usuario solicitante del estado
      const usuarioSolicitante = estado.replace('Solicitado por ', '');
      
      // Verificar si la solicitud es para este agente
      return row.agente === agente;
    });
    
    // Obtener información de los usuarios solicitantes
    const usuariosSolicitantes = [...new Set(
      solicitudesParaAgente.map(s => s.estado.replace('Solicitado por ', ''))
    )];
    
    let usuariosInfo: Record<string, any> = {};
    
    if (usuariosSolicitantes.length > 0) {
      const placeholders = usuariosSolicitantes.map((_, i) => `$${i + 1}`).join(',');
      const { rows: usuariosRows } = await pool.query(`
        SELECT user, nombre, apellido, foto_perfil
        FROM public.prefapp_users 
        WHERE user = ANY($1::text[])
      `, [usuariosSolicitantes]);
      
      usuariosRows.forEach(u => {
        usuariosInfo[u.user] = {
          user: u.user,
          nombre: u.nombre,
          apellido: u.apellido,
          foto_perfil: u.foto_perfil,
          iniciales: `${(u.nombre?.[0] || '').toUpperCase()}${(u.apellido?.[0] || '').toUpperCase()}`
        };
      });
    }
    
    // Mapear las solicitudes con información del usuario
    const solicitudes = solicitudesParaAgente.map(solicitud => {
      const usuarioSolicitante = solicitud.estado.replace('Solicitado por ', '');
      const usuarioInfo = usuariosInfo[usuarioSolicitante] || null;
      
      return {
        smp: solicitud.smp,
        direccion: solicitud.direccion,
        barrio: solicitud.barrio,
        estado: solicitud.estado,
        agente: solicitud.agente,
        m2aprox: solicitud.m2aprox,
        vventa: solicitud.vventa,
        usuarioSolicitante,
        usuarioInfo
      };
    });
    
    return NextResponse.json({ 
      solicitudes,
      total: solicitudes.length
    });
    
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    return NextResponse.json({ 
      error: 'Error al obtener solicitudes pendientes', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
