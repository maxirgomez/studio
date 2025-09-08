import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        MIN(anchofrente) as min_frente,
        MAX(anchofrente) as max_frente
      FROM public.frentesparcelas
      WHERE anchofrente IS NOT NULL AND anchofrente > 0
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ minFrente: 0, maxFrente: 50 });
    }

    const { min_frente, max_frente } = result.rows[0];
    
    return NextResponse.json({
      minFrente: Math.floor(min_frente || 0),
      maxFrente: Math.ceil(max_frente || 50)
    });

  } catch (error) {
    console.error('Error fetching frente range:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
