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

// Función para limpiar y normalizar num_dom
function normalizeNumDom(numDom: string): string {
  // Remover comas y convertir a número, luego de vuelta a string sin decimales
  const cleanNumDom = numDom.replace(/,/g, '');
  const numNumDom = parseFloat(cleanNumDom);
  return isNaN(numNumDom) ? numDom : Math.floor(numNumDom).toString();
}

// Función para expandir rangos de num_dom (ej: "927.929" -> ["927", "928", "929"])
// También maneja múltiples números separados por puntos (ej: "872.876.880.882" -> ["872", "876", "880", "882"])
function expandNumDomRange(numDom: string): string[] {
  if (!numDom || !numDom.includes('.')) {
    return [numDom];
  }
  
  const parts = numDom.split('.');
  
  // Si hay exactamente 2 partes, puede ser un rango (ej: "927.929")
  if (parts.length === 2) {
    const start = parseInt(parts[0]);
    const end = parseInt(parts[1]);
    
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      const result: string[] = [];
      for (let i = start; i <= end; i++) {
        result.push(i.toString());
      }
      return result;
    }
  }
  
  // Si hay más de 2 partes, son números individuales separados por puntos
  // (ej: "872.876.880.882.884.886.890.892.894.896.900")
  const result: string[] = [];
  for (const part of parts) {
    const num = parseInt(part);
    if (!isNaN(num)) {
      result.push(num.toString());
    }
  }
  
  return result.length > 0 ? result : [numDom];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const smp = searchParams.get('smp');
    const frente = searchParams.get('frente'); // Campo frente de frentesparcelas
    const num_dom = searchParams.get('num_dom') || searchParams.get('numero'); // Campo num_dom de frentesparcelas

    console.log('[API buscar] Params:', { smp, frente, num_dom });

    // Determinar el tipo de búsqueda
    const isAutocomplete = frente && !num_dom && !smp; // Solo calle para autocompletado
    const isNumberSearch = frente && searchParams.get('numero') !== null && !smp; // Calle + parámetro 'numero' para autocompletado de números
    const isExactSearch = smp || (frente && num_dom && num_dom !== ''); // Búsqueda exacta

    console.log('[API buscar] Search types:', { 
      isAutocomplete, 
      isNumberSearch, 
      isExactSearch,
      numeroParam: searchParams.get('numero')
    });

    let query = '';
    const values: any[] = [];
    let idx = 1;

    if (isAutocomplete) {
      // Búsqueda para autocompletado de calles desde frentesparcelas
      const { conditions, values: searchValues } = createSearchConditions(frente);
      query = `SELECT DISTINCT frente FROM public.frentesparcelas WHERE (${conditions.join(' OR ')}) ORDER BY frente`;
      values.push(...searchValues);
    } else if (isNumberSearch) {
      // Búsqueda para autocompletado de números desde frentesparcelas
      query = `SELECT DISTINCT num_dom FROM public.frentesparcelas WHERE LOWER(frente) = LOWER($${idx}) AND num_dom IS NOT NULL ORDER BY num_dom`;
      values.push(frente.toLowerCase());
      idx++;
    } else if (isExactSearch) {
      // Búsqueda exacta: buscar en frentesparcelas y obtener información normativa
      query = `
        SELECT 
          fp.*,
          pc.cur as codigo_urbanistico,
          pc.barrio,
          pc.dist_cpu_1 as cpu,
          cp.partida,
          ROUND(CAST(pc.inc_uva AS DECIMAL), 2) as incidencia_uva,
          ROUND(CAST(pc.fot_em_1 AS DECIMAL), 2) as fot,
          ROUND(CAST(pc.alicuota AS DECIMAL), 2) as alicuota,
          pm.m2aprox as m2_estimados
        FROM public.frentesparcelas fp
        LEFT JOIN public.parcelascur pc ON fp.smp = pc.smp
        LEFT JOIN public.cur_parcelas cp ON fp.smp = cp.smp
        LEFT JOIN public.prefapp_m2 pm ON fp.smp = pm.smp
        WHERE 1=1
      `;
      
      if (smp) {
        query += ` AND LOWER(fp.smp) = LOWER($${idx})`;
        values.push(smp);
        idx++;
      }
      if (frente) {
        // Búsqueda exacta por frente
        query += ` AND LOWER(fp.frente) = LOWER($${idx})`;
        values.push(frente.toLowerCase());
        idx++;
      }
      if (num_dom) {
        // Búsqueda flexible de num_dom que maneje formatos decimales y rangos
        const normalizedNumDom = normalizeNumDom(num_dom);
        // Buscar por coincidencia exacta o por rangos que contengan el número
        query += ` AND (
          fp.num_dom::text = $${idx}
          OR fp.num_dom::text LIKE $${idx + 1}
          OR fp.num_dom::text LIKE $${idx + 2}
          OR fp.num_dom::text LIKE $${idx + 3}
          OR fp.num_dom::text LIKE $${idx + 4}
        )`;
        values.push(num_dom); // Coincidencia exacta
        values.push(`%.${normalizedNumDom}.%`); // Para rangos que contengan el número
        values.push(`${normalizedNumDom}.%`); // Para rangos que empiecen con el número
        values.push(`%.${normalizedNumDom}`); // Para rangos que terminen con el número
        values.push(`%${normalizedNumDom}%`); // Búsqueda general que contenga el número
        idx += 5;
      }
      
      // Para búsquedas exactas, limitar a 1 resultado
      query += ' LIMIT 1';
    }

    console.log('[API buscar] Query:', query, values);
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return NextResponse.json({ found: false, lotes: [] });
    }

    // Mapear resultados según el tipo de búsqueda
    if (isAutocomplete) {
      // Solo devolver las calles únicas para autocompletado
      const calles = rows.map(row => row.frente).filter(Boolean);
      return NextResponse.json({ found: true, lotes: calles });
    } else if (isNumberSearch) {
      // Expandir rangos y devolver números únicos para autocompletado
      console.log('[API buscar] Raw rows from DB:', rows);
      const numerosConRangos = rows.map(row => row.num_dom).filter(Boolean);
      console.log('[API buscar] Numeros con rangos:', numerosConRangos);
      const numerosExpandidos = new Set<string>();
      
      numerosConRangos.forEach(numDom => {
        const numerosDelRango = expandNumDomRange(numDom);
        console.log('[API buscar] ExpandNumDomRange for', numDom, '->', numerosDelRango);
        numerosDelRango.forEach(num => numerosExpandidos.add(num));
      });
      
      // Los números ya vienen ordenados de la consulta SQL, pero los expandidos necesitan ordenarse
      const numeros = Array.from(numerosExpandidos).sort((a, b) => parseInt(a) - parseInt(b));
      console.log('[API buscar] Numeros finales:', numeros);
      return NextResponse.json({ found: true, lotes: numeros });
    } else {
      // Búsqueda exacta - devolver todos los datos del lote con información normativa
      console.log('[API buscar] Búsqueda exacta - rows encontradas:', rows);
      console.log('[API buscar] Búsqueda exacta - query ejecutada:', query);
      console.log('[API buscar] Búsqueda exacta - valores:', values);
      const lotes = rows.map(row => ({
        // Campos principales de frentesparcelas
        smp: row.smp, // SMP desde frentesparcelas
        frente: row.frente, // Calle desde frentesparcelas
        num_dom: row.num_dom, // Número desde frentesparcelas
        
        // Información normativa desde parcelascur, cur_parcelas y prefapp_m2 usando el SMP de frentesparcelas
        codigoUrbanistico: row.codigo_urbanistico, // Desde parcelascur.cur
        barrio: row.barrio, // Desde parcelascur.barrio
        m2_estimados: row.m2_estimados, // Desde prefapp_m2.m2aprox
        cpu: row.cpu, // Desde parcelascur.dist_cpu_1
        partida: row.partida, // Desde cur_parcelas.partida
        incidenciaUVA: row.incidencia_uva, // Desde parcelascur.inc_uva
        fot: row.fot, // Desde parcelascur.fot_em_1
        alicuota: row.alicuota, // Desde parcelascur.alicuota
        
        // Campos adicionales de frentesparcelas
        dir_lote: row.dir_lote,
        estado: row.estado,
        agente: row.agente,
        origen: row.origen,
        m2vendibles: row.m2vendibles,
        vventa: row.vventa,
        inctasada: row.inctasada,
        fpago: row.fpago,
        fventa: row.fventa,
        propietario: row.propietario,
        direccion: row.direccion,
        localidad: row.localidad,
        cp: row.cp,
        direccionalt: row.direccionalt,
        fallecido: row.fallecido,
        email: row.email,
        cuitcuil: row.cuitcuil,
        tel1: row.tel1,
        tel2: row.tel2,
        tel3: row.tel3,
        cel1: row.cel1,
        cel2: row.cel2,
        cel3: row.cel3
      }));
      return NextResponse.json({ found: true, lotes });
    }
  } catch (error) {
    console.error('[API buscar] Error:', error);
    return NextResponse.json({ error: 'Error al buscar lote', details: (error as Error).message }, { status: 500 });
  }
} 