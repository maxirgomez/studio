import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT origen FROM public.prefapp_lotes WHERE origen IS NOT NULL ORDER BY origen');
    const origenes = rows.map(r => r.origen);
    return NextResponse.json({ origenes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener origenes', details: (error as Error).message }, { status: 500 });
  }
} 