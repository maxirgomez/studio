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

    // Query para obtener todos los frentes de una parcela específica con superficie de parcela
    const query = `
      SELECT 
        fp.frente,
        fp.num_dom,
        fp.anchofrente,
        fp.smp,
        cp.sup_parcela
      FROM public.frentesparcelas fp
      LEFT JOIN public.cur_parcelas cp ON LOWER(fp.smp) = LOWER(cp.smp)
      WHERE LOWER(fp.smp) = LOWER($1)
      ORDER BY fp.frente, fp.num_dom
    `;

    const { rows } = await pool.query(query, [smp]);

    const frentes = rows.map(row => ({
      calle: row.frente,
      numero: row.num_dom,
      ancho_frente: row.anchofrente ? parseFloat(row.anchofrente) : null,
      smp: row.smp
    }));

    // Obtener superficie de parcela del primer registro (todos deberían tener el mismo valor)
    const superficieParcela = rows.length > 0 ? rows[0].sup_parcela : null;
    
    // Determinar si es esquina basado en la cantidad de frentes
    const isEsquina = frentes.length > 1;

    return NextResponse.json({ 
      frentes, 
      superficieParcela: superficieParcela ? parseFloat(superficieParcela) : null,
      isEsquina 
    });

  } catch (error) {
    console.error('Error al obtener frentes de parcela:', error);
    return NextResponse.json(
      { error: 'Error al obtener frentes de parcela', details: (error as Error).message },
      { status: 500 }
    );
  }
}
