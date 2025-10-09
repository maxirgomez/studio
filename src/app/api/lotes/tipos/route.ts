import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT tipo FROM public.prefapp_lotes WHERE tipo IS NOT NULL ORDER BY tipo');
    const tipos = rows.map(r => r.tipo);
    return NextResponse.json({ tipos });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tipos', details: (error as Error).message }, { status: 500 });
  }
}

