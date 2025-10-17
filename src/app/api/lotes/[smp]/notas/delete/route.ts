import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { extractAndValidateToken } from "@/lib/security";

// DELETE: Eliminar una nota específica usando agente y fecha
export async function DELETE(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  
  if (!smp) {
    return NextResponse.json({ error: "SMP es requerido" }, { status: 400 });
  }

  try {
    // ✅ Verificar autenticación (cookies O header Authorization)
    const decoded = extractAndValidateToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = decoded.user;
    const currentUserRole = decoded.role;

    const body = await req.json();
    const { agente, fecha } = body;

    if (!agente || !fecha) {
      return NextResponse.json({ error: "Agente y fecha son requeridos" }, { status: 400 });
    }

    // Los administradores pueden eliminar cualquier nota
    // Los demás solo pueden eliminar sus propias notas
    const isAdmin = currentUserRole === 'Administrador';
    if (!isAdmin && agente !== currentUser) {
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
    return NextResponse.json({ error: "Error al eliminar nota", details: (error as Error).message }, { status: 500 });
  }
}
