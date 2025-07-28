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
    
    // Función de normalización simplificada
    const normalizeEstado = (estado: string): string => {
      if (!estado) return estado;
      
      // Normalizar "Tomar Acción" - basado en los patrones que vemos
      if (estado.includes("Tomar Acci") || estado.includes("tomar acci") || estado.includes("Tomar acci")) {
        return 'Tomar Acción';
      }
      
      // Normalizar "Tasación" - basado en los patrones que vemos
      if (estado.includes("Tasaci")) {
        return 'Tasación';
      }
      
      // Para otros estados, mantener el original
      return estado;
    };
    
    // Normalizar y eliminar duplicados
    const normalizedEstados = [...new Set(estados.map(normalizeEstado))];
    
    // Ordenar alfabéticamente
    const sortedEstados = normalizedEstados.sort();
    
    return NextResponse.json({ estados: sortedEstados });
  } catch (error) {
    console.error('Error en endpoint estados:', error);
    return NextResponse.json({ error: 'Error al obtener estados', details: (error as Error).message }, { status: 500 });
  }
} 