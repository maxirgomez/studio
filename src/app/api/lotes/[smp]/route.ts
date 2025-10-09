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
    // Obtener datos básicos del lote
    const { rows } = await pool.query(
      `SELECT l.*
       FROM public.prefapp_lotes l 
       WHERE l.smp = $1 LIMIT 1`,
      [smp]
    );
    
    //console.log('Resultados encontrados:', rows.length);
    if (rows.length > 0) {
      //console.log('Primer resultado:', rows[0].smp);
    }
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    // Obtener datos de plusvalía por separado
    let plusvaliaData = null;
    try {
      const { rows: plusvaliaRows } = await pool.query(
        `SELECT a1, a2, "A1-A2", b, "AxB"
         FROM public.prefapp_m2_parcela 
         WHERE LOWER(smp) = LOWER($1) LIMIT 1`,
        [smp]
      );
      
      if (plusvaliaRows.length > 0) {
        plusvaliaData = plusvaliaRows[0];
      }
    } catch (plusvaliaError) {
      //console.log('Error al obtener datos de plusvalía:', plusvaliaError);
      
      // Continuamos sin datos de plusvalía
    }
    
    const lote = mapLote(rows[0], plusvaliaData);
    // Buscar usuario (agente) asociado usando JOIN
    let agenteUsuario = null;
    if (lote.agente) {
      const { rows: userRows } = await pool.query(
        `SELECT u.user, u.nombre, u.apellido, u.foto_perfil FROM public.prefapp_lotes l JOIN public.prefapp_users u ON LOWER(l.agente) = LOWER(u.user) WHERE l.smp = $1 LIMIT 1`,
        [lote.smp]
      );
      if (userRows.length > 0) {
        const user = userRows[0];
        agenteUsuario = {
          user: user.user,
          nombre: user.nombre,
          apellido: user.apellido,
          foto_perfil: user.foto_perfil,
          iniciales: `${(user.nombre?.[0] || '').toUpperCase()}${(user.apellido?.[0] || '').toUpperCase()}`,
        };
      }
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
  const currentUser = extractAndValidateToken(req);
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  try {
    // Obtener información del lote para verificar permisos
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = loteRows[0];
    const agenteValue = lote.agente;
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
} 