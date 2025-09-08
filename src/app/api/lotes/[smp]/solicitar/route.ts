import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// POST: Solicitar un lote
export async function POST(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  
  if (!smp) {
    return NextResponse.json({ error: "SMP es requerido" }, { status: 400 });
  }

  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = decoded.user;

    // Verificar que el lote existe
    const { rows: loteRows } = await pool.query(
      `SELECT smp, agente FROM prefapp_lotes WHERE smp = $1`,
      [smp]
    );

    if (loteRows.length === 0) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const lote = loteRows[0];

    // No permitir que el agente actual solicite su propio lote
    if (lote.agente === currentUser) {
      return NextResponse.json({ error: "No puedes solicitar tu propio lote" }, { status: 400 });
    }

    // Verificar si ya existe una solicitud pendiente
    const { rows: solicitudRows } = await pool.query(
      `SELECT id FROM prefapp_solicitudes_lotes 
       WHERE smp = $1 AND solicitante = $2 AND estado = 'pendiente'`,
      [smp, currentUser]
    );

    if (solicitudRows.length > 0) {
      return NextResponse.json({ error: "Ya tienes una solicitud pendiente para este lote" }, { status: 400 });
    }

    // Crear la solicitud
    const fecha = new Date().toISOString();
    const { rows: insertRows } = await pool.query(
      `INSERT INTO prefapp_solicitudes_lotes (smp, agente_actual, solicitante, fecha_solicitud, estado) 
       VALUES ($1, $2, $3, $4, 'pendiente') 
       RETURNING id`,
      [smp, lote.agente, currentUser, fecha]
    );

    return NextResponse.json({ 
      success: true, 
      solicitudId: insertRows[0].id,
      message: "Solicitud enviada correctamente"
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ 
      error: "Error al procesar la solicitud", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}

// GET: Obtener solicitudes de un lote
export async function GET(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  
  if (!smp) {
    return NextResponse.json({ error: "SMP es requerido" }, { status: 400 });
  }

  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = decoded.user;

    // Obtener el agente del lote
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM prefapp_lotes WHERE smp = $1`,
      [smp]
    );

    if (loteRows.length === 0) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const lote = loteRows[0];

    // Solo el agente asignado puede ver las solicitudes
    if (lote.agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para ver las solicitudes de este lote" }, { status: 403 });
    }

    // Obtener solicitudes pendientes
    const { rows: solicitudesRows } = await pool.query(
      `SELECT sl.*, u.nombre, u.apellido 
       FROM prefapp_solicitudes_lotes sl
       LEFT JOIN prefapp_users u ON sl.solicitante = u.user
       WHERE sl.smp = $1 AND sl.estado = 'pendiente'
       ORDER BY sl.fecha_solicitud DESC`,
      [smp]
    );

    return NextResponse.json({ solicitudes: solicitudesRows });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ 
      error: "Error al obtener solicitudes", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
