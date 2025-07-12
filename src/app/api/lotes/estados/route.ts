import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT estado FROM public.prefapp_lotes WHERE estado IS NOT NULL ORDER BY estado');
    const estados = rows.map(r => r.estado);
    return NextResponse.json({ estados });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estados', details: (error as Error).message }, { status: 500 });
  }
} 