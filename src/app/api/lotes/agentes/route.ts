import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT agente FROM public.prefapp_lotes WHERE agente IS NOT NULL ORDER BY agente');
    const agentes = rows.map(r => r.agente);
    return NextResponse.json({ agentes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener agentes', details: (error as Error).message }, { status: 500 });
  }
} 