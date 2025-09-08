import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// DELETE: Eliminar una nota específica
export async function DELETE(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  const notaId = awaitedParams?.id;
  
  if (!smp || !notaId) {
    return NextResponse.json({ error: "SMP e ID de nota son requeridos" }, { status: 400 });
  }

  try {
    // Verificar autenticación
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const currentUser = decoded.user;

    // Obtener todas las notas del lote ordenadas por fecha DESC
    const { rows: allNotes } = await pool.query(
      `SELECT smp, agente, notas, fecha FROM prefapp_notas WHERE smp = $1 ORDER BY fecha DESC`,
      [smp]
    );

    // El ID que viene del frontend es el índice (1-based) de la nota en la lista
    const noteIndex = parseInt(notaId) - 1;
    
    if (noteIndex < 0 || noteIndex >= allNotes.length) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    const nota = allNotes[noteIndex];
    
    // Solo el usuario que creó la nota puede eliminarla
    if (nota.agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta nota" }, { status: 403 });
    }

    // Eliminar la nota usando la fecha como identificador único
    await pool.query(
      `DELETE FROM prefapp_notas WHERE smp = $1 AND agente = $2 AND fecha = $3`,
      [smp, nota.agente, nota.fecha]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al eliminar nota", details: (error as Error).message }, { status: 500 });
  }
}

// PUT: Editar una nota específica
export async function PUT(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  const notaId = awaitedParams?.id;
  
  
  if (!smp || !notaId) {
    return NextResponse.json({ error: "SMP e ID de nota son requeridos" }, { status: 400 });
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
    const { notas: nuevaNota } = body;

    if (!nuevaNota || nuevaNota.trim() === "") {
      return NextResponse.json({ error: "El contenido de la nota es requerido" }, { status: 400 });
    }

    // Obtener todas las notas del lote ordenadas por fecha DESC
    const { rows: allNotes } = await pool.query(
      `SELECT smp, agente, notas, fecha FROM prefapp_notas WHERE smp = $1 ORDER BY fecha DESC`,
      [smp]
    );

    // El ID que viene del frontend es el índice (1-based) de la nota en la lista
    const noteIndex = parseInt(notaId) - 1;
    
    if (noteIndex < 0 || noteIndex >= allNotes.length) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    const nota = allNotes[noteIndex];
    
    // Solo el usuario que creó la nota puede editarla
    if (nota.agente !== currentUser) {
      return NextResponse.json({ error: "No tienes permisos para editar esta nota" }, { status: 403 });
    }

    // Actualizar la nota usando la fecha como identificador único
    const { rows: updatedRows } = await pool.query(
      `UPDATE prefapp_notas SET notas = $1 WHERE smp = $2 AND agente = $3 AND fecha = $4 RETURNING *`,
      [nuevaNota.trim(), smp, nota.agente, nota.fecha]
    );

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: "Error al actualizar la nota" }, { status: 500 });
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
