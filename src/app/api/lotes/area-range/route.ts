import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT MIN(m2aprox) as min_area, MAX(m2aprox) as max_area FROM public.prefapp_lotes WHERE m2aprox IS NOT NULL AND m2aprox > 0');
    
    const minArea = Math.floor(rows[0]?.min_area || 0);
    const maxArea = Math.ceil(rows[0]?.max_area || 1000);
    
    return NextResponse.json({ 
      minArea, 
      maxArea 
    });
  } catch (error) {
    console.error('Error al obtener rango de áreas:', error);
    return NextResponse.json(
      { error: 'Error al obtener rango de áreas', details: (error as Error).message },
      { status: 500 }
    );
  }
} 