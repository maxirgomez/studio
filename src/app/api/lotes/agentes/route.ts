import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT u.user, u.nombre, u.apellido
      FROM public.prefapp_lotes l
      JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user)
      WHERE l.agente IS NOT NULL AND u.user IS NOT NULL
      ORDER BY u.nombre, u.apellido
    `);
    const agentes = rows.map(r => ({
      user: r.user,
      nombre: r.nombre,
      apellido: r.apellido,
      iniciales: `${(r.nombre?.[0] || '').toUpperCase()}${(r.apellido?.[0] || '').toUpperCase()}`
    }));
    return NextResponse.json({ agentes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener agentes', details: (error as Error).message }, { status: 500 });
  }
} 