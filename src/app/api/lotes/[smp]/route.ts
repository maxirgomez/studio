import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function mapLote(row: any) {
  function cleanPhone(val: any) {
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
  
  // LOG para depuración de m2vendibles
  console.log('DEBUG row.m2vendibles:', row.m2vendibles);
  console.log('DEBUG row completo:', row);
  return {
    address: row.direccion,
    neighborhood: row.barrio,
    smp: row.smp,
    area: row.m2aprox, 
    status: row.estado,
    agente: row.agente, 
    foto_lote: row.foto_lote,
    origen: row.origen,
    codigoUrbanistico: row.codigo_urbanistico,
    cur: row.cur,
    cpu: [row.cpu, row.dist_cpu_1].filter(Boolean).join(' - '),
    partida: row.partida,
    listingDate: row.fecha_publicacion,
    saleDate: row.fecha_venta,
    incidenciaUVA: row.inc_uva,
    fot: row.fot,
    alicuota: row.alicuota,
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
    cp: row.cp,
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
  };
}

export async function GET(req: Request, context: any) {
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
  try {
    const { rows } = await pool.query(
      `SELECT * FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    const lote = mapLote(rows[0]);
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
    
    // Debug log para ver qué datos se están devolviendo
    console.log('DEBUG API /api/lotes/[smp]:', {
      loteAgente: lote.agente,
      agenteUsuario: agenteUsuario,
      agenteUsuarioUser: agenteUsuario?.user,
      loteCompleto: lote
    });
    
    return NextResponse.json({ lote, agenteUsuario });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: any) {
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
    console.log('[PUT /api/lotes/[smp]] SMP no especificado');
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  // Validación de seguridad: verificar que el usuario tenga permisos para editar este lote
  try {
    // Obtener información del usuario actual desde la sesión
    const userResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/me`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });
    
    if (!userResponse.ok) {
      console.log('[PUT /api/lotes/[smp]] Usuario no autenticado');
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }
    
    const userData = await userResponse.json();
    const currentUser = userData.user;
    
    if (!currentUser) {
      console.log('[PUT /api/lotes/[smp]] Usuario no encontrado');
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener información del lote para verificar permisos
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      console.log(`[PUT /api/lotes/${smp}] Lote no encontrado`);
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = loteRows[0];
    const agenteValue = lote.agente;
    const currentUserValue = currentUser.user;
    
    console.log('[PUT /api/lotes/[smp]] Validación de permisos:', {
      currentUser: currentUser,
      currentUserRol: currentUser?.rol,
      currentUserUser: currentUser?.user,
      loteAgente: agenteValue,
      isAdmin: currentUser?.rol === 'Administrador',
      isAssignedAgent: currentUserValue && agenteValue && 
        currentUserValue.toLowerCase() === agenteValue.toLowerCase()
    });

    // Solo los administradores tienen acceso total
    const isAdmin = currentUser?.rol === 'Administrador';
    
    // El usuario asignado al lote también puede editarlo
    const isAssignedAgent = currentUserValue && agenteValue &&
        currentUserValue.toLowerCase() === agenteValue.toLowerCase();
    
    if (!isAdmin && !isAssignedAgent) {
      console.log(`[PUT /api/lotes/${smp}] Acceso denegado - Usuario no autorizado`);
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo el agente asignado o un administrador pueden editar este lote.' 
      }, { status: 403 });
    }
    
  } catch (error) {
    console.error('[PUT /api/lotes/[smp]] Error en validación de permisos:', error);
    return NextResponse.json({ 
      error: 'Error al validar permisos de usuario' 
    }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log(`[PUT /api/lotes/${smp}] Body recibido:`, body);
    // Normalizar campos numéricos vacíos a null
    const numericFields = ['m2vendibles', 'vventa', 'inctasada'];
    for (const field of numericFields) {
      if (body[field] === "") {
        body[field] = null;
      }
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
      console.log(`[PUT /api/lotes/${smp}] Lote no encontrado`);
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    // Actualizar solo los campos editables
    const fields = [
      'propietario', 'direccion', 'localidad', 'cp', 'direccionalt', 'fallecido', 'email', 'cuitcuil',
      'tel1', 'tel2', 'tel3', 'cel1', 'cel2', 'cel3',
      'm2vendibles', 'vventa', 'inctasada', 'fpago', 'fventa',
      'agente', 'estado', 'foto_lote' // Agregar campo foto_lote
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
      console.log(`[PUT /api/lotes/${smp}] No hay campos para actualizar`);
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    values.push(smp);
    const updateQuery = `UPDATE public.prefapp_lotes SET ${updates.join(', ')} WHERE smp = $${idx}`;
    console.log(`[PUT /api/lotes/${smp}] Ejecutando query:`, updateQuery, 'con valores:', values);
    await pool.query(updateQuery, values);
    console.log(`[PUT /api/lotes/${smp}] Actualización exitosa`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[PUT /api/lotes/${smp}] Error al actualizar:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el lote', details: (error as Error).message },
      { status: 500 }
    );
  }
} 