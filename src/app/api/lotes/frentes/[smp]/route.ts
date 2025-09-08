import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { smp: string } }
) {
  try {
    const { smp } = params;
    
    if (!smp) {
      return NextResponse.json(
        { error: 'SMP es requerido' },
        { status: 400 }
      );
    }

    // Query para obtener los frentes de un SMP específico
    // Incluye calle, número y ancho del frente
    const query = `
      SELECT 
        calle,
        numero,
        ancho_frente,
        sup_parcela
      FROM cur_parcelas 
      WHERE smp = $1 
      ORDER BY calle, numero
    `;

    const result = await pool.query(query, [smp]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron frentes para este SMP' },
        { status: 404 }
      );
    }

    // Calcular si está en esquina (más de un frente)
    const isEsquina = result.rows.length > 1;
    
    // Calcular superficie total de parcela (debería ser la misma para todos los registros)
    const superficieParcela = result.rows[0]?.sup_parcela || 0;

    return NextResponse.json({
      smp,
      frentes: result.rows,
      isEsquina,
      superficieParcela,
      totalFrentes: result.rows.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
