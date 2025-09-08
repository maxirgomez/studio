import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request, context: any) {
  try {
    // Manejar params de Next.js 15
    let smp: string | undefined;
    if (context?.params && typeof context.params.then === 'function') {
      const awaitedParams = await context.params;
      smp = awaitedParams?.smp;
    } else {
      smp = context?.params?.smp;
    }
    
    if (!smp) {
      return NextResponse.json({ error: 'SMP es requerido' }, { status: 400 });
    }

    // Query para obtener todos los frentes de una parcela específica
    const query = `
      SELECT 
        fp.frente,
        fp.num_dom,
        fp.anchofrente,
        fp.smp
      FROM public.frentesparcelas fp
      WHERE LOWER(fp.smp) = LOWER($1)
      ORDER BY fp.frente, fp.num_dom
    `;

    const { rows } = await pool.query(query, [smp]);

    const frentes = rows.map(row => ({
      calle: row.frente,
      numero: row.num_dom,
      ancho: row.anchofrente ? parseFloat(row.anchofrente) : null,
      smp: row.smp
    }));

    return NextResponse.json({ frentes });

  } catch (error) {
    console.error('Error al obtener frentes de parcela:', error);
    return NextResponse.json(
      { error: 'Error al obtener frentes de parcela', details: (error as Error).message },
      { status: 500 }
    );
  }
}
