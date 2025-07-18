import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Traer todos los estados únicos de la tabla
    const { rows } = await pool.query(`
      SELECT DISTINCT estado 
      FROM public.prefapp_lotes 
      WHERE estado IS NOT NULL
      ORDER BY estado
    `);
    
    const estados = rows.map(r => r.estado);
    
    // Ordenar en JavaScript para mayor seguridad
    const statusOrder = [
      "Tomar Acción",
      "Tasación", 
      "Evolucionando",
      "Disponible",
      "Reservado",
      "Vendido",
      "No vende",
      "Descartado"
    ];
    
    const sortedEstados = estados.sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    return NextResponse.json({ estados: sortedEstados });
  } catch (error) {
    console.error('Error en endpoint estados:', error);
    return NextResponse.json({ error: 'Error al obtener estados', details: (error as Error).message }, { status: 500 });
  }
} 