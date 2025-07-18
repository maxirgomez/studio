import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Función para normalizar términos de búsqueda
function normalizeSearchTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const synonyms: string[] = [normalized];
  
  // Sinónimos para "Avenida"
  if (normalized.includes('avenida') || normalized.includes('av.') || normalized.includes('av ') || normalized.includes('avda') || normalized.includes('a v d a')) {
    synonyms.push('avenida', 'av.', 'av ', 'avda', 'a v d a');
  }
  
  // Sinónimos para "Calle"
  if (normalized.includes('calle') || normalized.includes('c/') || normalized.includes('c ')) {
    synonyms.push('calle', 'c/', 'c ');
  }
  
  // Sinónimos para "Boulevard"
  if (normalized.includes('boulevard') || normalized.includes('blvd') || normalized.includes('blvd.')) {
    synonyms.push('boulevard', 'blvd', 'blvd.');
  }
  
  // Sinónimos para "Doctor"
  if (normalized.includes('doctor') || normalized.includes('dr.') || normalized.includes('dr ')) {
    synonyms.push('doctor', 'dr.', 'dr ');
  }
  
  // Sinónimos para "General"
  if (normalized.includes('general') || normalized.includes('gral.') || normalized.includes('gral ')) {
    synonyms.push('general', 'gral.', 'gral ');
  }
  
  return [...new Set(synonyms)];
}

// Función para crear condiciones de búsqueda con sinónimos
function createSearchConditions(searchTerm: string): { conditions: string[], values: string[] } {
  const normalized = searchTerm.toLowerCase().trim();
  const conditions: string[] = [];
  const values: string[] = [];
  
  // Búsqueda original
  conditions.push(`LOWER(frente) LIKE $1`);
  values.push(`%${normalized}%`);
  
  // Sinónimos para "Avenida"
  if (normalized.includes('avenida')) {
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%av. ${normalized.replace('avenida', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%av ${normalized.replace('avenida', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%avda ${normalized.replace('avenida', '').trim()}%`);
  }
  
  // Sinónimos para "Av."
  if (normalized.includes('av.')) {
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%avenida ${normalized.replace('av.', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%av ${normalized.replace('av.', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%avda ${normalized.replace('av.', '').trim()}%`);
  }
  
  // Sinónimos para "Av "
  if (normalized.includes('av ')) {
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%avenida ${normalized.replace('av ', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%av. ${normalized.replace('av ', '').trim()}%`);
    conditions.push(`LOWER(frente) LIKE $${values.length + 1}`);
    values.push(`%avda ${normalized.replace('av ', '').trim()}%`);
  }
  
  return { conditions, values };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const smp = searchParams.get('smp');
    const frente = searchParams.get('frente');
    const num_dom = searchParams.get('num_dom') || searchParams.get('numero');

    console.log('[API buscar] Params:', { smp, frente, num_dom });

    let query = 'SELECT * FROM public.prefapp_lotes WHERE 1=1';
    const values: any[] = [];
    let idx = 1;

    if (smp) {
      query += ` AND LOWER(smp) = LOWER($${idx})`;
      values.push(smp);
      idx++;
    }
    if (frente) {
      // Buscar tanto por frente como por smp si el valor parece ser un SMP
      const isSMP = frente.includes('-') || /^\d/.test(frente);
      if (isSMP) {
        query += ` AND (LOWER(frente) = LOWER($${idx}) OR LOWER(smp) = LOWER($${idx}))`;
        values.push(frente.toLowerCase());
        idx++;
      } else {
        // Búsqueda relativa y flexible
        query += ` AND LOWER(frente) LIKE LOWER($${idx})`;
        values.push(`%${frente.toLowerCase()}%`);
        idx++;
      }
    }
    if (num_dom) {
      query += ` AND CAST(num_dom AS TEXT) = $${idx}`;
      values.push(num_dom);
      idx++;
    }
    query += ' LIMIT 10';
    console.log('[API buscar] Query:', query, values);
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return NextResponse.json({ found: false, lotes: [] });
    }
    // Mapear resultados a datos principales
    const lotes = rows.map(row => ({
      smp: row.smp,
      neighborhood: row.barrio,
      partida: row.partida,
      area: row.m2aprox,
      codigoUrbanistico: row.cur,
      cpu: row.dist_cpu_1,
      incidenciaUVA: row.inc_uva,
      fot: row.fot,
      alicuota: row.alicuota,
      frente: row.frente,
      num_dom: row.num_dom
    }));
    return NextResponse.json({ found: true, lotes });
  } catch (error) {
    console.error('[API buscar] Error:', error);
    return NextResponse.json({ error: 'Error al buscar lote', details: (error as Error).message }, { status: 500 });
  }
} 