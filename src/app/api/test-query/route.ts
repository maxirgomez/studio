import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const smp = searchParams.get('smp');
    
    if (!smp) {
      return NextResponse.json({ error: 'SMP requerido' }, { status: 400 });
    }

    // Query para encontrar el registro con el SMP específico
    const query = `
      SELECT 
        smp,
        frente,
        num_dom
      FROM public.frentesparcelas 
      WHERE LOWER(smp) = LOWER($1)
      LIMIT 1
    `;
    
    const { rows } = await pool.query(query, [smp]);
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        found: false, 
        message: `No se encontró el SMP ${smp}` 
      });
    }

    const registro = rows[0];
    
    // Ahora vamos a probar diferentes combinaciones de búsqueda
    // Extraer números individuales del rango
    const numerosIndividuales = registro.num_dom.split('.').filter(num => num.trim() !== '');
    
    const testQueries = [
      {
        name: "Búsqueda exacta con frente y num_dom completo",
        query: `SELECT smp, frente, num_dom FROM public.frentesparcelas WHERE LOWER(frente) = LOWER($1) AND num_dom = $2`,
        params: [registro.frente, registro.num_dom]
      },
      {
        name: "Búsqueda con frente exacto y num_dom como texto",
        query: `SELECT smp, frente, num_dom FROM public.frentesparcelas WHERE LOWER(frente) = LOWER($1) AND num_dom::text = $2`,
        params: [registro.frente, registro.num_dom.toString()]
      },
      {
        name: "Búsqueda con frente exacto y num_dom con LIKE",
        query: `SELECT smp, frente, num_dom FROM public.frentesparcelas WHERE LOWER(frente) = LOWER($1) AND num_dom::text LIKE $2`,
        params: [registro.frente, `%${registro.num_dom}%`]
      }
    ];

    // Agregar pruebas para números individuales
    numerosIndividuales.forEach((numero, index) => {
      testQueries.push({
        name: `Búsqueda por número individual ${numero} (posición ${index + 1})`,
        query: `SELECT smp, frente, num_dom FROM public.frentesparcelas WHERE LOWER(frente) = LOWER($1) AND num_dom::text LIKE $2`,
        params: [registro.frente, `%${numero}%`]
      });
    });

    const results = [];
    
    for (const testQuery of testQueries) {
      try {
        const { rows: testRows } = await pool.query(testQuery.query, testQuery.params);
        results.push({
          name: testQuery.name,
          query: testQuery.query,
          params: testQuery.params,
          found: testRows.length > 0,
          count: testRows.length,
          results: testRows
        });
      } catch (error) {
        results.push({
          name: testQuery.name,
          query: testQuery.query,
          params: testQuery.params,
          error: (error as Error).message
        });
      }
    }

    return NextResponse.json({
      target_smp: smp,
      original_record: registro,
      test_results: results
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al ejecutar la consulta', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
