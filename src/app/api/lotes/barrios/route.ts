import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function capitalizeWords(str: string) {
  return str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT barrio FROM public.prefapp_lotes WHERE barrio IS NOT NULL ORDER BY barrio');
    // Devolver los barrios en su formato original de la base de datos
    const barrios = rows.map(r => r.barrio);
    return NextResponse.json({ barrios });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener barrios', details: (error as Error).message }, { status: 500 });
  }
} 