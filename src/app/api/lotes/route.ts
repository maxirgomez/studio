import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function capitalizeWords(str: string) {
  return str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function normalizeBarrio(str: string) {
  return capitalizeWords(str.trim());
}

// Función para normalizar caracteres acentuados
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[ü]/g, 'u') // Convertir ü a u
    .replace(/[ñ]/g, 'n') // Convertir ñ a n
    .toLowerCase();
}

function mapLote(row: any, agenteUsuario: any = null) {
  return {
    address: row.direccion || row.dir_lote || 'Dirección no disponible',
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.m2aprox,
    status: row.estado,
    agent: {
      user: row.agente,
      nombre: agenteUsuario?.nombre || null,
      apellido: agenteUsuario?.apellido || null,
      initials: agenteUsuario ? `${(agenteUsuario.nombre?.[0] || '').toUpperCase()}${(agenteUsuario.apellido?.[0] || '').toUpperCase()}` : (row.agente ? row.agente[0].toUpperCase() : "")
    },
    imageUrl: row.foto_lote,
    aiHint: row.ai_hint,
    origen: row.origen,
    tipo: row.tipo,
    esquina: row.esquina,
    codigoUrbanistico: row.codigo_urbanistico,
    cpu: row.cpu,
    partida: row.partida,
    valorVentaUSD: row.valor_venta_usd,
    listingDate: row.fecha_publicacion,
    saleDate: row.fecha_venta,
    incidenciaUVA: row.incidencia_uva,
    fot: row.fot,
    alicuota: row.alicuota,
    m2Vendibles: row.m2_vendibles,
    incidenciaTasadaUSD: row.incidencia_tasada_usd,
    formaDePago: row.forma_pago,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Leer filtros
  const agent = searchParams.get('agent');
  const neighborhood = searchParams.get('neighborhood');
  const status = searchParams.get('status');
  const origen = searchParams.get('origen');
  const tipo = searchParams.get('tipo');
  const esquina = searchParams.get('esquina');
  const minArea = searchParams.get('minArea');
  const maxArea = searchParams.get('maxArea');
  const minFrente = searchParams.get('minFrente');
  const maxFrente = searchParams.get('maxFrente');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'gid';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Debug: Log de todos los parámetros recibidos
  /*
  console.log('=== PARÁMETROS RECIBIDOS ===');
  console.log('minFrente:', minFrente, 'maxFrente:', maxFrente);
  console.log('minArea:', minArea, 'maxArea:', maxArea);
  console.log('esquina:', esquina);
  console.log('agent:', agent);
  console.log('neighborhood:', neighborhood);
  console.log('status:', status);
  console.log('origen:', origen);
  console.log('tipo:', tipo);
  console.log('search:', search);*/

  // Construir query dinámica
  let whereClauses = [];
  let values: any[] = [];
  let idx = 1;

  if (agent) {
    const agents = agent.split(',').map(a => a.trim()).filter(Boolean);
    if (agents.length > 0) {
      whereClauses.push(`l.agente = ANY($${idx}::text[])`);
      values.push(agents);
      idx++;
    }
  }
  if (neighborhood) {
    const neighborhoods = neighborhood.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    if (neighborhoods.length > 0) {
      whereClauses.push(`LOWER(TRIM(l.barrio)) = ANY($${idx}::text[])`);
      values.push(neighborhoods);
      idx++;
    }
  }
  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      // Normalizar los estados del filtro para que coincidan con los de la BD
      const normalizedStatuses = statuses.map(s => {
        if (s === 'Tomar Acción' || s === 'Tomar AcciÃ³n') {
          return 'Tomar acción'; // Valor exacto en la BD
        }
        if (s === 'Tasación' || s === 'TasaciÃ³n') {
          return 'Tasación'; // Valor exacto en la BD
        }
        return s;
      });
      whereClauses.push(`l.estado = ANY($${idx}::text[])`);
      values.push(normalizedStatuses);
      idx++;
    }
  }
  if (origen) {
    const origens = origen.split(',').map(o => o.trim()).filter(Boolean);
    if (origens.length > 0) {
      whereClauses.push(`l.origen = ANY($${idx}::text[])`);
      values.push(origens);
      idx++;
    }
  }
  if (tipo) {
    const tipos = tipo.split(',').map(t => t.trim()).filter(Boolean);
    if (tipos.length > 0) {
      whereClauses.push(`l.tipo = ANY($${idx}::text[])`);
      values.push(tipos);
      idx++;
    }
  }
  if (esquina) {
    const esquinas = esquina.split(',').map(e => e.trim()).filter(Boolean);
    if (esquinas.length > 0) {
      // Para el filtro de esquina, considerar ambos criterios:
      // 1. Tabla parcelas_esquina
      // 2. Lotes con múltiples frentes (frentesparcelas)
      if (esquinas.includes('Si')) {
        whereClauses.push(`(
          l.smp IN (SELECT smp FROM public.parcelas_esquina) OR
          l.smp IN (
            SELECT smp 
            FROM public.frentesparcelas 
            GROUP BY smp 
            HAVING COUNT(*) > 1
          )
        )`);
      } else if (esquinas.includes('No')) {
        whereClauses.push(`(
          l.smp NOT IN (SELECT smp FROM public.parcelas_esquina) AND
          l.smp NOT IN (
            SELECT smp 
            FROM public.frentesparcelas 
            GROUP BY smp 
            HAVING COUNT(*) > 1
          )
        )`);
      }
      // Si hay ambos valores (Si y No), no agregamos ninguna condición (muestra todos)
    }
  }
  if (minArea) {
    whereClauses.push(`l.m2aprox IS NOT NULL AND CAST(l.m2aprox AS DECIMAL) >= $${idx}`);
    values.push(Number(minArea));
    idx++;
  }
  if (maxArea) {
    whereClauses.push(`l.m2aprox IS NOT NULL AND CAST(l.m2aprox AS DECIMAL) <= $${idx}`);
    values.push(Number(maxArea));
    idx++;
  }
  if (minFrente || maxFrente) {
    // Alternativa 1: JOIN directo con frentesparcelas para mejor performance
    const frenteConditions = [];
    if (minFrente) {
      frenteConditions.push(`fp.anchofrente >= $${idx}`);
      values.push(Number(minFrente));
      idx++;
    }
    if (maxFrente) {
      frenteConditions.push(`fp.anchofrente <= $${idx}`);
      values.push(Number(maxFrente));
      idx++;
    }
    
    whereClauses.push(`EXISTS (
      SELECT 1 
      FROM public.frentesparcelas fp 
      WHERE fp.smp = l.smp 
      AND fp.anchofrente IS NOT NULL 
      AND fp.anchofrente > 0
      ${frenteConditions.length > 0 ? 'AND ' + frenteConditions.join(' AND ') : ''}
    )`);
  }
  if (search) {
    
    whereClauses.push(`(
      LOWER(l.smp) LIKE $${idx} OR 
      LOWER(l.dir_lote) LIKE $${idx} OR 
      LOWER(l.barrio) LIKE $${idx} OR 
      LOWER(l.estado) LIKE $${idx} OR 
      LOWER(l.origen) LIKE $${idx} OR 
      LOWER(l.agente) LIKE $${idx} OR
      LOWER(u.nombre) LIKE $${idx} OR
      LOWER(u.apellido) LIKE $${idx} OR
      LOWER(CONCAT(u.nombre, ' ', u.apellido)) LIKE $${idx} OR
      -- Búsqueda normalizada para caracteres especiales (sin acentos)
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.smp, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.dir_lote, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.barrio, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.estado, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.origen, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(l.agente, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.nombre, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.apellido, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx} OR
      LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONCAT(u.nombre, ' ', u.apellido), 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U'), 'Ü', 'U'), 'Ñ', 'N')) LIKE $${idx}
    )`);
    values.push(`%${search.toLowerCase()}%`);
    idx++;
  }

  let where = '';
  if (whereClauses.length > 0) {
    where = 'WHERE ' + whereClauses.join(' AND ');
  }

  // Debug: Log de la query y valores
  /*console.log('=== DEBUG FILTROS ===');
  console.log('Where clauses:', whereClauses);
  console.log('Values:', values);
  console.log('Where:', where);*/
  
  // Query para el total con JOIN
  const countQuery = `
    SELECT COUNT(*) 
    FROM public.prefapp_lotes l
    LEFT JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user)
    ${where}
  `;

  // Validar y mapear el campo de ordenamiento
  const validSortFields = ['gid', 'm2aprox', 'smp', 'dir_lote', 'barrio', 'estado', 'agente', 'origen'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'gid';
  const validSortOrders = ['asc', 'desc'];
  const orderDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

  // Manejar ordenamiento especial para m2aprox (valores nulos al final)
  let orderClause = `l.${sortField} ${orderDirection}`;
  if (sortField === 'm2aprox') {
    if (orderDirection === 'ASC') {
      orderClause = `CASE WHEN l.m2aprox IS NULL OR l.m2aprox = '0' OR l.m2aprox = '0.00' THEN 1 ELSE 0 END, CAST(l.m2aprox AS DECIMAL) ASC`;
    } else {
      orderClause = `CASE WHEN l.m2aprox IS NULL OR l.m2aprox = '0' OR l.m2aprox = '0.00' THEN 1 ELSE 0 END, CAST(l.m2aprox AS DECIMAL) DESC`;
    }
  }

  // Agregar paginación
  const pagValues = [...values, limit, offset];
  const query = `
    SELECT l.*, u.nombre, u.apellido
    FROM public.prefapp_lotes l
    LEFT JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user)
    ${where} 
    ORDER BY ${orderClause} 
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  try {
    // Obtener el total
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    // Obtener los lotes paginados
    const { rows } = await pool.query(query, pagValues);

    const lotes = rows.map(row => {
      // La información del agente ya viene del JOIN
      const agenteUsuario = row.nombre && row.apellido ? {
        nombre: row.nombre,
        apellido: row.apellido,
        user: row.agente
      } : null;
      return mapLote(row, agenteUsuario);
    });
    
    
    return NextResponse.json({ lotes, total });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener los lotes', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Nuevo endpoint para barrios únicos
export async function GET_BARRIOS() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT barrio FROM public.prefapp_lotes WHERE barrio IS NOT NULL ORDER BY barrio');
    const barrios = rows.map(r => r.barrio);
    return NextResponse.json({ barrios });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener barrios', details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validar campos requeridos
    const requiredFields = [
      'smp', 'propietario', 'estado', 'agente', 'origen', 'tipo'
    ];
    
    for (const field of requiredFields) {
      if (!body[field] || body[field] === "") {
        return NextResponse.json({ error: `El campo '${field}' es requerido.` }, { status: 400 });
      }
    }
    
    // Validar campos que pueden ser 0 pero no null/undefined
    const numericFields = ['m2aprox'];
    for (const field of numericFields) {
      if (body[field] === null || body[field] === undefined || body[field] === "") {
        return NextResponse.json({ error: `El campo '${field}' es requerido.` }, { status: 400 });
      }
    }
    
    // Validar campos de texto que pueden estar vacíos pero no null
    const textFields = ['direccion', 'barrio'];
    for (const field of textFields) {
      if (body[field] === null || body[field] === undefined) {
        return NextResponse.json({ error: `El campo '${field}' es requerido.` }, { status: 400 });
      }
      // Si está vacío, asignar un valor por defecto
      if (body[field] === "") {
        body[field] = "Sin especificar";
      }
    }
    
    
    // Chequear si ya existe un lote con ese SMP
    const { rows: existingRows } = await pool.query(
      `SELECT 1 FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [body.smp]
    );
    if (existingRows.length > 0) {
      return NextResponse.json({ error: 'Ya existe un lote con ese SMP.' }, { status: 409 });
    }
    
    
    // Insertar el nuevo lote
    const insertFields = [
      'smp', 'propietario', 'direccion', 'barrio', 'm2aprox', 'estado', 'agente', 'origen', 'tipo',
      'cur', 'dist_cpu_1', 'partida', 'inc_uva', 'fot', 'alicuota',
      'localidad', 'cp', 'direccionalt', 'fallecido', 'email', 'cuitcuil', 'otros',
      'tel1', 'tel2', 'tel3', 'cel1', 'cel2', 'cel3',
      'm2vendibles', 'vventa', 'inctasada', 'fpago', 'fventa', 'foto_lote'
    ];
    
    const values = insertFields.map(f => {
      let value = body[f] === undefined ? null : body[f];
      
      // Convertir campos numéricos
      const numericFields = ['m2aprox', 'cuitcuil', 'tel1', 'tel2', 'tel3', 'cel1', 'cel2', 'cel3', 'm2vendibles', 'vventa', 'inctasada', 'fot', 'alicuota', 'inc_uva'];
      if (numericFields.includes(f)) {
        if (value === null || value === undefined || value === "") {
          value = null;
        } else {
          value = Number(value);
          if (isNaN(value)) {
            value = null;
          }
        }
      }
      
      return value;
    });
    
    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO public.prefapp_lotes (${insertFields.join(', ')}) VALUES (${placeholders})`;
    
    
    const result = await pool.query(insertQuery, values);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear el lote', details: (error as Error).message }, { status: 500 });
  }
} 