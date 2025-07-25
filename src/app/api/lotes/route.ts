import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function capitalizeWords(str: string) {
  return str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function normalizeBarrio(str: string) {
  return capitalizeWords(str.trim());
}

function mapLote(row: any, agenteUsuario: any = null) {
  return {
    address: row.dir_lote,
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
  const minArea = searchParams.get('minArea');
  const maxArea = searchParams.get('maxArea');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'gid';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  // Construir query dinámica
  let whereClauses = [];
  let values: any[] = [];
  let idx = 1;

  if (agent) {
    const agents = agent.split(',').map(a => a.trim()).filter(Boolean);
    if (agents.length > 0) {
      whereClauses.push(`agente = ANY($${idx}::text[])`);
      values.push(agents);
      idx++;
    }
  }
  if (neighborhood) {
    const neighborhoods = neighborhood.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    if (neighborhoods.length > 0) {
      whereClauses.push(`LOWER(TRIM(barrio)) = ANY($${idx}::text[])`);
      values.push(neighborhoods);
      idx++;
    }
  }
  if (status) {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length > 0) {
      whereClauses.push(`estado = ANY($${idx}::text[])`);
      values.push(statuses);
      idx++;
    }
  }
  if (origen) {
    const origens = origen.split(',').map(o => o.trim()).filter(Boolean);
    if (origens.length > 0) {
      whereClauses.push(`origen = ANY($${idx}::text[])`);
      values.push(origens);
      idx++;
    }
  }
  if (minArea) {
    whereClauses.push(`m2aprox IS NOT NULL AND CAST(m2aprox AS DECIMAL) >= $${idx}`);
    values.push(Number(minArea));
    idx++;
  }
  if (maxArea) {
    whereClauses.push(`m2aprox IS NOT NULL AND CAST(m2aprox AS DECIMAL) <= $${idx}`);
    values.push(Number(maxArea));
    idx++;
  }
  if (search) {
    whereClauses.push(`(LOWER(smp) LIKE LOWER($${idx}) OR LOWER(dir_lote) LIKE LOWER($${idx}) OR LOWER(barrio) LIKE LOWER($${idx}))`);
    values.push(`%${search.toLowerCase()}%`);
    idx++;
  }

  let where = '';
  if (whereClauses.length > 0) {
    where = 'WHERE ' + whereClauses.join(' AND ');
  }

  // Query para el total
  const countQuery = `SELECT COUNT(*) FROM public.prefapp_lotes ${where}`;

  // Validar y mapear el campo de ordenamiento
  const validSortFields = ['gid', 'm2aprox', 'smp', 'dir_lote', 'barrio', 'estado', 'agente', 'origen'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'gid';
  const validSortOrders = ['asc', 'desc'];
  const orderDirection = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';

  // Manejar ordenamiento especial para m2aprox (valores nulos al final)
  let orderClause = `${sortField} ${orderDirection}`;
  if (sortField === 'm2aprox') {
    if (orderDirection === 'ASC') {
      orderClause = `CASE WHEN m2aprox IS NULL OR m2aprox = '0' OR m2aprox = '0.00' THEN 1 ELSE 0 END, CAST(m2aprox AS DECIMAL) ASC`;
    } else {
      orderClause = `CASE WHEN m2aprox IS NULL OR m2aprox = '0' OR m2aprox = '0.00' THEN 1 ELSE 0 END, CAST(m2aprox AS DECIMAL) DESC`;
    }
  }

  // Agregar paginación
  const pagValues = [...values, limit, offset];
  const query = `SELECT * FROM public.prefapp_lotes ${where} ORDER BY ${orderClause} LIMIT $${idx} OFFSET $${idx + 1}`;

  try {
    // Obtener el total
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);
    // Obtener los lotes paginados
    const { rows } = await pool.query(query, pagValues);

    // Obtener info de agentes con JOIN (como en el filtro)
    const { rows: agentesRows } = await pool.query(`
      SELECT DISTINCT l.agente, u.user, u.nombre, u.apellido
      FROM public.prefapp_lotes l
      JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user)
      WHERE l.agente IS NOT NULL AND u.user IS NOT NULL
    `);
    let agentesInfo: Record<string, any> = {};
    agentesRows.forEach(u => {
      agentesInfo[u.agente.toLowerCase()] = u;
    });

    const lotes = rows.map(row => {
      const agenteUsuario = agentesInfo[(row.agente || '').toLowerCase()] || null;
      if (agenteUsuario) {
        console.log('DEBUG agenteUsuario encontrado:', agenteUsuario);
      } else {
        console.log('DEBUG agenteUsuario NO encontrado para:', row.agente);
      }
      return mapLote(row, agenteUsuario);
    });
    return NextResponse.json({ lotes, total });
  } catch (error) {
    console.error('Error en /api/lotes:', error);
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
      'smp', 'propietario', 'direccion', 'barrio', 'superficie', 'estado', 'agente', 'origen'
    ];
    for (const field of requiredFields) {
      if (!body[field] || body[field] === "") {
        return NextResponse.json({ error: `El campo '${field}' es requerido.` }, { status: 400 });
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
      'smp', 'propietario', 'direccion', 'barrio', 'm2aprox', 'estado', 'agente', 'origen',
      'codigo_urbanistico', 'cpu', 'partida', 'incidencia_uva', 'fot', 'alicuota',
      'localidad', 'cp', 'direccionalt', 'fallecido', 'email',
      'tel1', 'tel2', 'tel3', 'cel1', 'cel2', 'cel3',
      'm2vendibles', 'vventa', 'inctasada', 'fpago', 'fventa'
    ];
    const values = insertFields.map(f => body[f] === undefined ? null : body[f]);
    const placeholders = insertFields.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO public.prefapp_lotes (${insertFields.join(', ')}) VALUES (${placeholders})`;
    await pool.query(insertQuery, values);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/lotes] Error al crear lote:', error);
    return NextResponse.json({ error: 'Error al crear el lote', details: (error as Error).message }, { status: 500 });
  }
} 