import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Traer todos los usuarios que pueden ser agentes (todos los usuarios)
    const { rows } = await pool.query(`
      SELECT u.user, u.nombre, u.apellido, u.foto_perfil
      FROM public.prefapp_users u
      ORDER BY u.nombre, u.apellido
    `);
    const agentes = rows.map(r => ({
      user: r.user,
      nombre: r.nombre,
      apellido: r.apellido,
      foto_perfil: r.foto_perfil,
      iniciales: `${(r.nombre?.[0] || '').toUpperCase()}${(r.apellido?.[0] || '').toUpperCase()}`
    }));
    return NextResponse.json({ agentes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener agentes', details: (error as Error).message }, { status: 500 });
  }
} 