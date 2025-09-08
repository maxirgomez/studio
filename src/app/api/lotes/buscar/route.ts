import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Función para normalizar caracteres especiales (diéresis, acentos, etc.)
function normalizeSpecialChars(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (diéresis, acentos)
    .replace(/[ü]/g, 'u') // Caso específico para ü -> u
    .replace(/[Ü]/g, 'U') // Caso específico para Ü -> U
    .replace(/[ñ]/g, 'n') // Caso específico para ñ -> n
    .replace(/[Ñ]/g, 'N'); // Caso específico para Ñ -> N
}

// Función para generar variaciones de búsqueda con caracteres especiales
function generateSearchVariations(text: string): string[] {
  const variations: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Agregar la versión original
  variations.push(lowerText);
  
  // Generar variaciones con caracteres especiales
  // Caso específico: guemes -> güemes
  if (lowerText.includes('guemes')) {
    variations.push(lowerText.replace(/guemes/g, 'güemes'));
  }
  if (lowerText.includes('güemes')) {
    variations.push(lowerText.replace(/güemes/g, 'guemes'));
  }
  
  // Caso específico: general -> gral
  if (lowerText.includes('general')) {
    variations.push(lowerText.replace(/general/g, 'gral'));
  }
  if (lowerText.includes('gral')) {
    variations.push(lowerText.replace(/gral/g, 'general'));
  }
  
  // Caso específico: doctor -> dr
  if (lowerText.includes('doctor')) {
    variations.push(lowerText.replace(/doctor/g, 'dr'));
  }
  if (lowerText.includes('dr')) {
    variations.push(lowerText.replace(/dr/g, 'doctor'));
  }
  
  return [...new Set(variations)];
}

// Función para generar patrones de búsqueda que incluyan caracteres especiales
function generateSearchPatterns(text: string): string[] {
  const patterns: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Patrón original
  patterns.push(`%${lowerText}%`);
  
  // Patrón con normalización de caracteres especiales
  const normalized = normalizeSpecialChars(text);
  if (normalized !== lowerText) {
    patterns.push(`%${normalized}%`);
  }
  
  // Patrones específicos para casos comunes
  if (lowerText.includes('guemes')) {
    patterns.push(`%güemes%`);
  }
  if (lowerText.includes('güemes')) {
    patterns.push(`%guemes%`);
  }
  
  return [...new Set(patterns)];
}

// Función para normalizar términos de búsqueda
function normalizeSearchTerm(term: string): string[] {
  const normalized = term.toLowerCase().trim();
  const normalizedSpecial = normalizeSpecialChars(term).trim();
  const synonyms: string[] = [normalized, normalizedSpecial];
  
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
  const searchPatterns = generateSearchPatterns(searchTerm);
  const conditions: string[] = [];
  const values: string[] = [];
  
  // Búsqueda con todos los patrones generados
  searchPatterns.forEach((pattern, index) => {
    conditions.push(`LOWER(frente) LIKE $${index + 1}`);
    values.push(pattern);
  });
  
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

    

    // Determinar el tipo de búsqueda
    const isAutocomplete = frente && !num_dom && !smp; // Solo calle para autocompletado
    const isNumberSearch = frente && searchParams.get('numero') !== null && !smp; // Calle + parámetro 'numero' para autocompletado de números
    const isExactSearch = smp || (frente && num_dom && num_dom !== ''); // Búsqueda exacta

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
      const normalizedFrente = normalizeSpecialChars(frente);
             query = `SELECT DISTINCT num_dom FROM public.frentesparcelas WHERE (LOWER(frente) = LOWER($${idx}) OR LOWER(frente) = LOWER($${idx + 1})) AND num_dom IS NOT NULL ORDER BY num_dom`;
      values.push(frente.toLowerCase());
      values.push(normalizedFrente);
      idx += 2;
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
          ROUND(CAST(pc.alicuota AS DECIMAL), 2) as alicuota
        FROM public.frentesparcelas fp
        LEFT JOIN public.parcelascur pc ON fp.smp = pc.smp
        LEFT JOIN public.cur_parcelas cp ON fp.smp = cp.smp
        WHERE 1=1
      `;
      
      if (smp) {
        query += ` AND LOWER(fp.smp) = LOWER($${idx})`;
        values.push(smp);
        idx++;
      }
      if (frente) {
        // Búsqueda exacta por frente con normalización de caracteres especiales
        const normalizedFrente = normalizeSpecialChars(frente);
                 query += ` AND (LOWER(fp.frente) = LOWER($${idx}) OR LOWER(fp.frente) = LOWER($${idx + 1}))`;
        values.push(frente.toLowerCase());
        values.push(normalizedFrente);
        idx += 2;
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
      
      const numerosConRangos = rows.map(row => row.num_dom).filter(Boolean);
      
      const numerosExpandidos = new Set<string>();
      
      numerosConRangos.forEach(numDom => {
        const numerosDelRango = expandNumDomRange(numDom);
        
        numerosDelRango.forEach(num => numerosExpandidos.add(num));
      });
      
      // Los números ya vienen ordenados de la consulta SQL, pero los expandidos necesitan ordenarse
      const numeros = Array.from(numerosExpandidos).sort((a, b) => parseInt(a) - parseInt(b));
      
      return NextResponse.json({ found: true, lotes: numeros });
    } else {
      // Búsqueda exacta - devolver todos los datos del lote con información normativa
      
      
      
      const lotes = rows.map(row => ({
        // Campos principales de frentesparcelas
        smp: row.smp, // SMP desde frentesparcelas
        frente: row.frente, // Calle desde frentesparcelas
        num_dom: row.num_dom, // Número desde frentesparcelas
        
        // Información normativa desde parcelascur, cur_parcelas usando el SMP de frentesparcelas
        codigoUrbanistico: row.codigo_urbanistico, // Desde parcelascur.cur
        barrio: row.barrio, // Desde parcelascur.barrio
        m2_estimados: 0, // Valor por defecto ya que no tenemos la tabla prefapp_m2
        sup_parcela: 0, // Valor por defecto ya que no tenemos la tabla prefapp_m2
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
    return NextResponse.json({ error: 'Error al buscar lote', details: (error as Error).message }, { status: 500 });
  }
} 