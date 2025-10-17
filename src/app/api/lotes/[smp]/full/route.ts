import { NextResponse, NextRequest } from 'next/server';
import pool from '@/lib/db';

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
    const str = String(cuitcuil).replace(/\.0+$/, '');
    if (/^\d{11}$/.test(str)) {
      return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
    }
    return str;
  }

  function generateFotoLoteUrl(smp: string, existingFotoLote: string | null): string | null {
    if (existingFotoLote) {
      return existingFotoLote;
    }
    if (smp) {
      const fotoUrl = `https://fotos.usig.buenosaires.gob.ar/getFoto?smp=${smp.toUpperCase()}`;
      return fotoUrl;
    }
    return null;
  }
  
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
    m2vendibles: row.m2vendibles,
    vventa: row.vventa,
    inctasada: row.inctasada,
    fpago: row.fpago,
    fventa: row.fventa,
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
    A1: plusvaliaData?.a1 || null,
    A2: plusvaliaData?.a2 || null,
    "A1-A2": plusvaliaData?.["A1-A2"] || null,
    B: plusvaliaData?.b || null,
    AxB: plusvaliaData?.["AxB"] || null,
  };
}

/**
 * ✅ ENDPOINT CONSOLIDADO
 * Devuelve todos los datos del lote en una sola llamada:
 * - Lote + Plusvalía + Agente (1 query con CTEs)
 * - Notas (últimas 100, con JOIN a users)
 * - Frentes (con JOIN a cur_parcelas)
 * - Documentos
 * 
 * Beneficio: 4 requests → 1 request (~75% más rápido)
 */
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
    smp = parts[parts.length - 2]; // /full está al final
  }
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  try {
    // ✅ PARALELIZACIÓN: Ejecutar todas las queries simultáneamente
    const [loteResult, notasResult, frentesResult, docsResult] = await Promise.all([
      // Query 1: Lote + Plusvalía + Agente (consolidada con CTEs)
      pool.query(
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
      ),
      
      // Query 2: Notas (últimas 100, con JOIN a users)
      pool.query(
        `SELECT n.smp, n.agente, n.notas, n.fecha, 
                u.nombre, u.apellido, u.foto_perfil, u.initials
         FROM prefapp_notas n
         LEFT JOIN prefapp_users u ON n.agente = u.user
         WHERE n.smp = $1 
         ORDER BY n.fecha DESC
         LIMIT 100`,
        [smp]
      ),
      
      // Query 3: Frentes (con JOIN a cur_parcelas)
      pool.query(
        `SELECT 
           fp.frente,
           fp.num_dom,
           fp.anchofrente,
           fp.smp,
           cp.sup_parcela
         FROM public.frentesparcelas fp
         LEFT JOIN public.cur_parcelas cp ON LOWER(fp.smp) = LOWER(cp.smp)
         WHERE LOWER(fp.smp) = LOWER($1)
         ORDER BY fp.frente, fp.num_dom`,
        [smp]
      ),
      
      // Query 4: Documentos
      pool.query(
        `SELECT smp, ruta, agente, fecha 
         FROM prefapp_docs 
         WHERE smp = $1 
         ORDER BY fecha DESC`,
        [smp]
      )
    ]);

    // Validar que el lote existe
    if (loteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }

    const row = loteResult.rows[0];
    
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

    // Mapear notas (usar agente + fecha como ID único)
    const notas = notasResult.rows.map((nota) => {
      // ✅ Formatear fecha a ISO string (YYYY-MM-DD) para ID consistente
      const fechaISO = nota.fecha instanceof Date 
        ? nota.fecha.toISOString().split('T')[0]
        : String(nota.fecha).split('T')[0];
      
      return {
        id: `${nota.agente}-${fechaISO}`, // ID único: usuario-2025-10-09
        smp: nota.smp,
        agente: {
          user: nota.agente,
          nombre: nota.nombre,
          apellido: nota.apellido,
          avatarUrl: nota.foto_perfil,
          initials: nota.initials
        },
        notas: nota.notas,
        fecha: nota.fecha 
      };
    });

    // Mapear frentes
    const frentes = frentesResult.rows.map(row => ({
      calle: row.frente,
      numero: row.num_dom,
      ancho_frente: row.anchofrente ? parseFloat(row.anchofrente) : null,
      smp: row.smp
    }));

    const superficieParcela = frentesResult.rows.length > 0 ? frentesResult.rows[0].sup_parcela : null;
    const isEsquina = frentes.length > 1;

    // Los docs ya vienen en el formato correcto
    const docs = docsResult.rows;

    // ✅ RESPUESTA CONSOLIDADA
    return NextResponse.json({
      lote,
      agenteUsuario,
      notas,
      frentes,
      superficieParcela: superficieParcela ? parseFloat(superficieParcela) : null,
      isEsquina,
      docs
    });

  } catch (error) {
    console.error('Error en endpoint consolidado:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del lote', details: (error as Error).message },
      { status: 500 }
    );
  }
}

