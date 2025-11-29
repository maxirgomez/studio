import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Endpoint optimizado que devuelve TODOS los datos de filtros en una sola request
 * Reduce de 7 requests a 1 sola request
 */
export async function GET() {
  try {
    // Ejecutar todas las queries en paralelo
    const [
      barriosResult,
      estadosResult,
      origenesResult,
      tiposResult,
      agentesResult,
      areaRangeResult,
      frenteRangeResult,
    ] = await Promise.all([
      // Barrios
      pool.query('SELECT DISTINCT barrio FROM public.prefapp_lotes WHERE barrio IS NOT NULL ORDER BY barrio'),
      
      // Estados
      pool.query('SELECT DISTINCT estado FROM public.prefapp_lotes WHERE estado IS NOT NULL ORDER BY estado'),
      
      // Orígenes
      pool.query('SELECT DISTINCT origen FROM public.prefapp_lotes WHERE origen IS NOT NULL ORDER BY origen'),
      
      // Tipos
      pool.query('SELECT DISTINCT tipo FROM public.prefapp_lotes WHERE tipo IS NOT NULL ORDER BY tipo'),
      
      // Agentes (con información del usuario)
      pool.query(`
        SELECT DISTINCT l.agente as user, u.nombre, u.apellido, u.foto_perfil
        FROM public.prefapp_lotes l
        LEFT JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user)
        WHERE l.agente IS NOT NULL
        ORDER BY u.nombre, u.apellido
      `),
      
      // Rango de área
      pool.query(`
        SELECT 
          COALESCE(MIN(CAST(m2aprox AS DECIMAL)), 0) as min_area,
          COALESCE(MAX(CAST(m2aprox AS DECIMAL)), 1000) as max_area
        FROM public.prefapp_lotes 
        WHERE m2aprox IS NOT NULL 
          AND m2aprox != '' 
          AND CAST(m2aprox AS DECIMAL) > 0
      `),
      
      // Rango de frente
      pool.query(`
        SELECT 
          COALESCE(MIN(anchofrente), 0) as min_frente,
          COALESCE(MAX(anchofrente), 50) as max_frente
        FROM public.frentesparcelas 
        WHERE anchofrente IS NOT NULL 
          AND anchofrente > 0
      `),
    ]);

    // Procesar agentes con iniciales
    const agentes = agentesResult.rows.map(a => ({
      user: a.user,
      nombre: a.nombre || '',
      apellido: a.apellido || '',
      foto_perfil: a.foto_perfil || null,
      iniciales: `${(a.nombre?.[0] || '').toUpperCase()}${(a.apellido?.[0] || '').toUpperCase()}` || a.user?.[0]?.toUpperCase() || '?',
    }));

    return NextResponse.json({
      barrios: barriosResult.rows.map(r => r.barrio),
      estados: estadosResult.rows.map(r => r.estado),
      origenes: origenesResult.rows.map(r => r.origen),
      tipos: tiposResult.rows.map(r => r.tipo),
      agentes,
      areaRange: {
        minArea: Math.floor(Number(areaRangeResult.rows[0]?.min_area || 0)),
        maxArea: Math.ceil(Number(areaRangeResult.rows[0]?.max_area || 1000)),
      },
      frenteRange: {
        minFrente: Math.floor(Number(frenteRangeResult.rows[0]?.min_frente || 0)),
        maxFrente: Math.ceil(Number(frenteRangeResult.rows[0]?.max_frente || 50)),
      },
    });
  } catch (error) {
    console.error('Error al obtener filtros:', error);
    return NextResponse.json(
      { error: 'Error al obtener los filtros' },
      { status: 500 }
    );
  }
}
