import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { extractAndValidateToken } from "@/lib/security";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// GET: Traer todas las notas de un lote
export async function GET(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  
  if (!smp) {
    
    return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  }
  try {
    const { rows } = await pool.query(
      `SELECT n.smp, n.agente, n.notas, n.fecha, u.nombre, u.apellido, u.foto_perfil, u.initials
       FROM prefapp_notas n
       LEFT JOIN prefapp_users u ON n.agente = u.user
       WHERE n.smp = $1 ORDER BY n.fecha DESC`,
      [smp]
    );
    
    const notas = rows.map((nota, index) => ({ 
      id: index + 1, // Generar ID temporal basado en el índice
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
    }));
    
    
    return NextResponse.json({ notas });
  } catch (error) {
    console.error('Error al obtener notas:', error);
    return NextResponse.json({ error: "Error al obtener notas", details: (error as Error).message }, { status: 500 });
  }
}

// POST: Insertar una nueva nota
export async function POST(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  
  if (!smp) {
    return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  }
  
  // ✅ Verificar autenticación (cookies O header Authorization)
  const decoded = extractAndValidateToken(req);
  if (!decoded) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  
  // Extraer datos del usuario del token
  const agente = decoded.user;
  const rol = decoded.role;

  // Verificar que el lote existe
  try {
    const { rows: loteRows } = await pool.query(
      `SELECT smp FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al verificar lote' 
    }, { status: 500 });
  }
  let body;
  try {
    body = await req.json();
    
  } catch (err) {
    
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const { nota } = body;
  if (!nota || typeof nota !== "string" || !nota.trim()) {
    
    return NextResponse.json({ error: "Nota vacía" }, { status: 400 });
  }
  // Guardar la fecha como YYYY-MM-DD (compatible con columna date)
  const fechaActual = new Date();
  const fecha = fechaActual.toISOString().slice(0, 10); // YYYY-MM-DD
  
  try {
    // Insertar la nota
    const insertQuery = `INSERT INTO prefapp_notas (smp, agente, notas, fecha) VALUES ($1, $2, $3, $4)`;
    await pool.query(insertQuery, [smp, agente, nota, fecha]);
    
    // Obtener información completa del usuario desde la base de datos
    const { rows: userRows } = await pool.query(
      `SELECT nombre, apellido, foto_perfil, initials FROM prefapp_users WHERE user = $1 LIMIT 1`,
      [agente]
    );
    
    const userInfo = userRows[0] || {
      nombre: '',
      apellido: '',
      foto_perfil: '',
      initials: ''
    };
    
    const notaInsertada = {
      id: `${agente}-${fecha}`, // ✅ ID único: usuario-2025-10-09
      smp: smp,
      agente: {
        user: agente,
        nombre: userInfo.nombre,
        apellido: userInfo.apellido,
        avatarUrl: userInfo.foto_perfil,
        initials: userInfo.initials
      },
      notas: nota,
      fecha: fecha, // YYYY-MM-DD
    };
    
    
    // Devolver la nota insertada con información del usuario actual
    return NextResponse.json({
      success: true,
      nota: notaInsertada
    });
  } catch (error) {
    console.error('Error al insertar nota:', error);
    return NextResponse.json({ error: "Error al insertar nota", details: (error as Error).message }, { status: 500 });
  }
} 