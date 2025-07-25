import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// GET: Traer todas las notas de un lote
export async function GET(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  console.log("[NOTAS][GET] smp:", smp);
  if (!smp) {
    console.log("[NOTAS][GET] SMP no especificado");
    return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  }
  try {
    const { rows } = await pool.query(
      `SELECT smp, agente, notas, fecha FROM prefapp_notas WHERE smp = $1 ORDER BY fecha DESC`,
      [smp]
    );
    const notas = rows.map(nota => ({ ...nota, fecha: nota.fecha }));
    console.log("[NOTAS][GET] Notas encontradas:", notas.length);
    return NextResponse.json({ notas });
  } catch (error) {
    console.error("[NOTAS][GET] Error al obtener notas:", error);
    return NextResponse.json({ error: "Error al obtener notas", details: (error as Error).message }, { status: 500 });
  }
}

// POST: Insertar una nueva nota
export async function POST(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  console.log("[NOTAS][POST] smp:", smp);
  if (!smp) {
    console.log("[NOTAS][POST] SMP no especificado");
    return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  }
  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.log("[NOTAS][POST] No autenticado (sin token)");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
    console.log("[NOTAS][POST] Payload usuario:", payload);
  } catch (err) {
    console.log("[NOTAS][POST] Token inválido o expirado");
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
  // El usuario logueado
  const agente = typeof payload === 'object' && 'user' in payload ? payload.user : null;
  const nombre = typeof payload === 'object' && 'nombre' in payload ? payload.nombre : null;
  const apellido = typeof payload === 'object' && 'apellido' in payload ? payload.apellido : null;
  const avatarUrl = typeof payload === 'object' && 'avatarUrl' in payload ? payload.avatarUrl : null;
  const aiHint = typeof payload === 'object' && 'aiHint' in payload ? payload.aiHint : null;
  const initials = typeof payload === 'object' && 'initials' in payload ? payload.initials : null;
  const rol = typeof payload === 'object' && 'rol' in payload ? payload.rol : null;
  
  if (!agente) {
    console.log("[NOTAS][POST] Usuario no encontrado en el token");
    return NextResponse.json({ error: "Usuario no encontrado en el token" }, { status: 401 });
  }

  // Validación de seguridad: verificar que el usuario tenga permisos para agregar notas a este lote
  try {
    // Obtener información del lote para verificar permisos
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      console.log(`[NOTAS][POST] Lote no encontrado: ${smp}`);
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = loteRows[0];
    const loteAgente = lote.agente;
    
    console.log('[NOTAS][POST] Validación de permisos:', {
      currentUser: agente,
      currentUserRol: rol,
      loteAgente: loteAgente,
      isAdmin: rol === 'Administrador',
      isAssignedAgent: agente && loteAgente && 
        agente.toLowerCase() === loteAgente.toLowerCase()
    });

    // Solo los administradores tienen acceso total
    const isAdmin = rol === 'Administrador';
    
    // El usuario asignado al lote también puede agregar notas
    const isAssignedAgent = agente && loteAgente &&
        agente.toLowerCase() === loteAgente.toLowerCase();
    
    if (!isAdmin && !isAssignedAgent) {
      console.log(`[NOTAS][POST] Acceso denegado - Usuario no autorizado para lote ${smp}`);
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo el agente asignado o un administrador pueden agregar notas a este lote.' 
      }, { status: 403 });
    }
    
  } catch (error) {
    console.error('[NOTAS][POST] Error en validación de permisos:', error);
    return NextResponse.json({ 
      error: 'Error al validar permisos de usuario' 
    }, { status: 500 });
  }
  let body;
  try {
    body = await req.json();
    console.log("[NOTAS][POST] Body recibido:", body);
  } catch (err) {
    console.log("[NOTAS][POST] Error al parsear body:", err);
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const { nota } = body;
  if (!nota || typeof nota !== "string" || !nota.trim()) {
    console.log("[NOTAS][POST] Nota vacía");
    return NextResponse.json({ error: "Nota vacía" }, { status: 400 });
  }
  // Guardar la fecha como YYYY-MM-DD (compatible con columna date)
  const fecha = new Date().toISOString().slice(0, 10);
  try {
    // Insertar la nota (sin RETURNING)
    const insertQuery = `INSERT INTO prefapp_notas (smp, agente, notas, fecha) VALUES ($1, $2, $3, $4)`;
    await pool.query(insertQuery, [smp, agente, nota, fecha]);
    // Buscar la última nota insertada para este smp, agente y texto
    const selectQuery = `SELECT smp, agente, notas, fecha FROM prefapp_notas WHERE smp = $1 AND agente = $2 AND notas = $3 AND fecha = $4 ORDER BY fecha DESC LIMIT 1`;
    const { rows } = await pool.query(selectQuery, [smp, agente, nota, fecha]);
    const notaInsertada = rows[0];
    console.log("[NOTAS][POST] Nota insertada para smp:", smp);
    // Devolver la nota insertada con los datos de usuario para el frontend
    return NextResponse.json({
      success: true,
      nota: {
        smp,
        agente, // <-- solo el username
        notas: nota,
        fecha: notaInsertada?.fecha,
      }
    });
  } catch (error) {
    console.error("[NOTAS][POST] Error al insertar nota:", error);
    return NextResponse.json({ error: "Error al insertar nota", details: (error as Error).message }, { status: 500 });
  }
} 