import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// PUT: Actualizar una nota específica usando agente y fecha
export async function PUT(req: NextRequest, { params }: any) {
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
    const { agente, fecha, nota: nuevaNota } = body;

    if (!agente || !fecha || !nuevaNota || nuevaNota.trim() === "") {
      return NextResponse.json({ error: "Agente, fecha y contenido de la nota son requeridos" }, { status: 400 });
    }

    // Verificar que el usuario actual es el mismo que creó la nota
    if (agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para editar esta nota" }, { status: 403 });
    }

    // Actualizar la nota
    const { rows: updatedRows } = await pool.query(
      `UPDATE prefapp_notas SET notas = $1 WHERE smp = $2 AND agente = $3 AND fecha = $4 RETURNING *`,
      [nuevaNota.trim(), smp, agente, fecha]
    );

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: "Nota no encontrada o no se pudo actualizar" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      nota: updatedRows[0] 
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al editar nota", details: (error as Error).message }, { status: 500 });
  }
}
