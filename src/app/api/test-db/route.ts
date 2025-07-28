import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Verificar la estructura de la tabla prefapp_lotes
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'prefapp_lotes' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Estructura de prefapp_lotes:', columns);
    
    return NextResponse.json({ 
      message: 'Estructura de la tabla prefapp_lotes',
      columns: columns 
    });
  } catch (error) {
    console.error('Error al verificar estructura de tabla:', error);
    return NextResponse.json({ 
      error: 'Error al verificar estructura', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 