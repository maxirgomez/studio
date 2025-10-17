import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';
import { extractAndValidateToken } from '@/lib/security';

function mapLote(row: any, plusvaliaData: any = null) {
  function cleanPhone(val: any) {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\.0+$/, "");
  }
  
  function cleanNumericString(val: any): string {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\.0+$/, "");
  }
  
  function formatCuitCuil(cuitcuil: any): string {
    if (!cuitcuil) return '';
    const str = String(cuitcuil).replace(/\.0+$/, ''); // Eliminar .0000000000
    if (/^\d{11}$/.test(str)) {
      return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
    }
    return str;
  }

  function generateFotoLoteUrl(smp: string, existingFotoLote: string | null): string | null {
    // Si ya hay una URL de foto_lote, usarla
    if (existingFotoLote) {
      return existingFotoLote;
    }
    
    
    // Si no hay URL existente, generar una nueva
    if (smp) {
      const fotoUrl = `https://fotos.usig.buenosaires.gob.ar/getFoto?smp=${smp.toUpperCase()}`;
      return fotoUrl;
    }
    
    return null;
  }
  
  
  // LOG para depuración de m2vendibles
  return {
    address: row.direccion,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.m2aprox, 
    status: row.estado,
    agente: row.agente, 
    foto_lote: generateFotoLoteUrl(row.smp, row.foto_lote),
    origen: row.origen,
    tipo: row.tipo,
    codigoUrbanistico: row.codigo_urbanistico,
    cur: row.cur,
    cpu: [row.cpu, row.dist_cpu_1].filter(Boolean).join(' - '),
    partida: row.partida,
    listingDate: row.fecha_publicacion,
    saleDate: row.fecha_venta,
    incidenciaUVA: row.inc_uva,
    fot: row.fot,
    alicuota: row.alicuota,
    sup_parcela: row.sup_parcela,
    // --- Tasación ---
    m2vendibles: row.m2vendibles,
    vventa: row.vventa,
    inctasada: row.inctasada,
    fpago: row.fpago,
    fventa: row.fventa,
    // ---
    propietario: row.propietario,
    direccion: row.direccion,
    localidad: row.localidad,
    cp: cleanNumericString(row.cp),
    direccionalt: row.direccionalt,
    fallecido: row.fallecido,
    email: row.email,
    cuitcuil: formatCuitCuil(row.cuitcuil),
    tel1: cleanPhone(row.tel1),
    tel2: cleanPhone(row.tel2),
    tel3: cleanPhone(row.tel3),
    cel1: cleanPhone(row.cel1),
    cel2: cleanPhone(row.cel2),
    cel3: cleanPhone(row.cel3),
    // --- Plusvalía ---
    A1: plusvaliaData?.a1 || null,           // A1 (Área CUr * 0,8)
    A2: plusvaliaData?.a2 || null,           // A2 (Área FOT)
    "A1-A2": plusvaliaData?.["A1-A2"] || null,   // A1 - A2
    B: plusvaliaData?.b || null,             // B (Incidencia * Alícuota)
    AxB: plusvaliaData?.["AxB"] || null,         // AxB (UVAs Estimadas)
  };
}

export async function GET(req: NextRequest, context: any) {
  let smp: string | undefined;
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
  } else {
    smp = context?.params?.smp;
  }
  if (!smp) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    smp = parts[parts.length - 1] || parts[parts.length - 2];
  }
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }
  
  //console.log('Buscando lote con SMP:', smp);
  
  try {
    // ✅ OPTIMIZACIÓN: Query consolidada con CTEs (3 queries → 1 query)
    const { rows } = await pool.query(
      `WITH lote_base AS (
         SELECT l.* FROM public.prefapp_lotes l WHERE l.smp = $1 LIMIT 1
       ),
       plusvalia AS (
         SELECT a1, a2, "A1-A2", b, "AxB"
         FROM public.prefapp_m2_parcela
         WHERE LOWER(smp) = LOWER($1)
         LIMIT 1
       ),
       agente_info AS (
         SELECT u.user, u.nombre, u.apellido, u.foto_perfil
         FROM lote_base lb
         LEFT JOIN public.prefapp_users u ON LOWER(lb.agente) = LOWER(u.user)
       )
       SELECT 
         lb.*,
         p.a1, p.a2, p."A1-A2", p.b, p."AxB",
         a.user as agente_user,
         a.nombre as agente_nombre,
         a.apellido as agente_apellido,
         a.foto_perfil as agente_foto
       FROM lote_base lb
       LEFT JOIN plusvalia p ON TRUE
       LEFT JOIN agente_info a ON TRUE`,
      [smp]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const row = rows[0];
    
    // Preparar datos de plusvalía
    const plusvaliaData = {
      a1: row.a1,
      a2: row.a2,
      "A1-A2": row["A1-A2"],
      b: row.b,
      "AxB": row["AxB"]
    };
    
    const lote = mapLote(row, plusvaliaData);
    
    // Preparar datos del agente
    let agenteUsuario = null;
    if (row.agente_user) {
      agenteUsuario = {
        user: row.agente_user,
        nombre: row.agente_nombre,
        apellido: row.agente_apellido,
        foto_perfil: row.agente_foto,
        iniciales: `${(row.agente_nombre?.[0] || '').toUpperCase()}${(row.agente_apellido?.[0] || '').toUpperCase()}`,
      };
    }
    
    return NextResponse.json({ lote, agenteUsuario });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: any) {
  let smp: string | undefined;
  if (context?.params && typeof context.params.then === 'function') {
    const awaitedParams = await context.params;
    smp = awaitedParams?.smp;
  } else {
    smp = context?.params?.smp;
  }
  if (!smp) {
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    smp = parts[parts.length - 1] || parts[parts.length - 2];
  }
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  // Validación de seguridad: verificar que el usuario tenga permisos para editar este lote
  // console.log('🔐 PUT - Intentando validar token...');
  // console.log('🔐 PUT - Headers:', req.headers.get('authorization') ? 'Authorization header presente' : 'Sin Authorization header');
  // console.log('🔐 PUT - Cookies:', req.cookies.get('token') ? 'Cookie token presente' : 'Sin cookie token');
  
  const currentUser = extractAndValidateToken(req);
  
  // console.log('🔐 PUT - Usuario validado:', currentUser ? `${currentUser.user} (${currentUser.role})` : 'null');
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  // Variables para almacenar info del lote
  let agenteValue: string | null = null;
  let direccionLote: string | null = null;

  try {
    // Obtener información del lote para verificar permisos y dirección
    const { rows: loteRows } = await pool.query(
      `SELECT agente, direccion FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = loteRows[0];
    agenteValue = lote.agente;
    direccionLote = lote.direccion;
    const currentUserValue = currentUser.user;

    // Solo los administradores tienen acceso total
    const isAdmin = currentUser?.role === 'Administrador';
    
    // El usuario asignado al lote también puede editarlo
    const isAssignedAgent = currentUserValue && agenteValue &&
        currentUserValue.toLowerCase() === agenteValue.toLowerCase();
    
    if (!isAdmin && !isAssignedAgent) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo el agente asignado o un administrador pueden editar este lote.' 
      }, { status: 403 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al validar permisos de usuario' 
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    // Normalizar campos numéricos vacíos a null
    const numericFields = ['m2vendibles', 'vventa', 'inctasada'];
    for (const field of numericFields) {
      if (body[field] === "") {
        body[field] = null;
      }
    }
    
    // Normalizar el campo tipo (capitalizar primera letra)
    if (body.tipo && typeof body.tipo === 'string') {
      body.tipo = body.tipo.charAt(0).toUpperCase() + body.tipo.slice(1).toLowerCase();
    }
    
    // Limpiar formato del CUIT/CUIL si existe
    if (body.cuitcuil) {
      body.cuitcuil = String(body.cuitcuil).replace(/[^0-9]/g, ''); // Solo números
    }
    // Validar que el lote existe
    const { rows: existingRows } = await pool.query(
      `SELECT 1 FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    // Actualizar solo los campos editables
    const fields = [
      'propietario', 'direccion', 'localidad', 'cp', 'direccionalt', 'fallecido', 'email', 'cuitcuil',
      'tel1', 'tel2', 'tel3', 'cel1', 'cel2', 'cel3',
      'm2vendibles', 'vventa', 'inctasada', 'fpago', 'fventa',
      'agente', 'estado', 'tipo', 'foto_lote' // Agregar campos tipo y foto_lote
    ];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const field of fields) {
      if (body[field] !== undefined) {
        // Si el valor es string vacío, lo convertimos a null
        const value = body[field] === "" ? null : body[field];
        updates.push(`${field} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    values.push(smp);
    const updateQuery = `UPDATE public.prefapp_lotes SET ${updates.join(', ')} WHERE smp = $${idx}`;
    await pool.query(updateQuery, values);
    
    // Si se cambió el agente, crear una nota automática
    if (body.agente !== undefined && body.agente !== agenteValue) {
      const nuevoAgente = body.agente;
      const agenteAnterior = agenteValue || 'Sin asignar';
      
      // Nota para el agente anterior (si existe)
      if (agenteAnterior && agenteAnterior !== 'Sin asignar') {
        await pool.query(
          `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
           VALUES ($1, $2, $3, NOW())`,
          [smp, agenteAnterior, `Lote "${direccionLote}" reasignado a ${nuevoAgente || 'Sin asignar'} por ${currentUser.user}`]
        );
      }
      
      // Nota para el nuevo agente (si existe)
      if (nuevoAgente) {
        await pool.query(
          `INSERT INTO prefapp_notas (smp, agente, notas, fecha) 
           VALUES ($1, $2, $3, NOW())`,
          [smp, nuevoAgente, `Lote "${direccionLote}" reasignado desde ${agenteAnterior} por ${currentUser.user}`]
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
} 