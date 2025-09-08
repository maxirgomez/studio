import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// PUT: Responder a una solicitud (aceptar/rechazar)
export async function PUT(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  const solicitudId = awaitedParams?.id;
  
  if (!smp || !solicitudId) {
    return NextResponse.json({ error: "SMP e ID de solicitud son requeridos" }, { status: 400 });
  }

  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = decoded.user;

    const body = await req.json();
    const { accion } = body; // 'aceptar' o 'rechazar'

    if (!accion || !['aceptar', 'rechazar'].includes(accion)) {
      return NextResponse.json({ error: "Acción inválida. Debe ser 'aceptar' o 'rechazar'" }, { status: 400 });
    }

    // Obtener la solicitud
    const { rows: solicitudRows } = await pool.query(
      `SELECT * FROM prefapp_solicitudes_lotes WHERE id = $1 AND smp = $2 AND estado = 'pendiente'`,
      [solicitudId, smp]
    );

    if (solicitudRows.length === 0) {
      return NextResponse.json({ error: "Solicitud no encontrada o ya procesada" }, { status: 404 });
    }

    const solicitud = solicitudRows[0];

    // Verificar que el usuario actual es el agente del lote
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM prefapp_lotes WHERE smp = $1`,
      [smp]
    );

    if (loteRows.length === 0) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    const lote = loteRows[0];

    if (lote.agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para responder a esta solicitud" }, { status: 403 });
    }

    // Actualizar el estado de la solicitud
    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';
    const fechaRespuesta = new Date().toISOString();

    await pool.query(
      `UPDATE prefapp_solicitudes_lotes 
       SET estado = $1, fecha_respuesta = $2 
       WHERE id = $3`,
      [nuevoEstado, fechaRespuesta, solicitudId]
    );

    // Si se acepta, transferir el lote al solicitante
    if (accion === 'aceptar') {
      await pool.query(
        `UPDATE prefapp_lotes SET agente = $1 WHERE smp = $2`,
        [solicitud.solicitante, smp]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Solicitud ${accion === 'aceptar' ? 'aceptada' : 'rechazada'} correctamente`
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ 
      error: "Error al procesar la respuesta", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
