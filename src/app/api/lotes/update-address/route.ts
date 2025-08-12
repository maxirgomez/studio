import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { smp, direccion } = body;

    if (!smp || !direccion) {
      return NextResponse.json({ error: 'SMP y dirección son requeridos' }, { status: 400 });
    }

    console.log(`[POST /api/lotes/update-address] Actualizando lote ${smp} con dirección: ${direccion}`);

    // Verificar que el lote existe
    const { rows: existingRows } = await pool.query(
      'SELECT direccion FROM public.prefapp_lotes WHERE smp = $1',
      [smp]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }

    console.log(`[POST /api/lotes/update-address] Dirección actual: ${existingRows[0].direccion}`);

    // Actualizar el lote
    const updateQuery = `
      UPDATE public.prefapp_lotes 
      SET direccion = $1, foto_lote = $2
      WHERE smp = $3
    `;
    
    const fotoUrl = `https://fotos.usig.buenosaires.gob.ar/getFoto?smp=${smp}`;
    
    await pool.query(updateQuery, [direccion, fotoUrl, smp]);

    console.log(`[POST /api/lotes/update-address] Lote ${smp} actualizado exitosamente`);
    console.log(`[POST /api/lotes/update-address] Nueva dirección: ${direccion}`);
    console.log(`[POST /api/lotes/update-address] Nueva foto: ${fotoUrl}`);

    return NextResponse.json({ 
      success: true, 
      smp,
      direccion,
      foto_lote: fotoUrl,
      direccionAnterior: existingRows[0].direccion
    });

  } catch (error) {
    console.error('[POST /api/lotes/update-address] Error:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar el lote', 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
