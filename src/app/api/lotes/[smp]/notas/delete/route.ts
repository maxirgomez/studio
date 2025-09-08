import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// DELETE: Eliminar una nota específica usando agente y fecha
export async function DELETE(req: NextRequest, { params }: any) {
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

    const body = await req.json();
    const { agente, fecha } = body;

    if (!agente || !fecha) {
      return NextResponse.json({ error: "Agente y fecha son requeridos" }, { status: 400 });
    }

    // Verificar que el usuario actual es el mismo que creó la nota
    if (agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta nota" }, { status: 403 });
    }

    // Eliminar la nota
    const { rowCount } = await pool.query(
      `DELETE FROM prefapp_notas WHERE smp = $1 AND agente = $2 AND fecha = $3`,
      [smp, agente, fecha]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al eliminar nota", details: (error as Error).message }, { status: 500 });
  }
}
