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

    // ✅ Manejar el body de forma segura
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error al parsear body:', parseError);
      return NextResponse.json({ error: "Body inválido o vacío" }, { status: 400 });
    }

    const { agente, fecha, notas: contenidoNota, sinFecha } = body;

    // Los administradores pueden eliminar cualquier nota
    // Los demás solo pueden eliminar sus propias notas
    const isAdmin = currentUserRole === 'Administrador';
    
    // Si no es admin y no hay agente, no puede eliminar
    if (!isAdmin && (!agente || agente !== currentUser)) {
      return NextResponse.json({ error: "No tienes permisos para eliminar esta nota" }, { status: 403 });
    }

    // Manejar caso especial: nota sin fecha (solo para administradores)
    if (sinFecha === true && isAdmin) {
      // Eliminar usando smp, agente (null) y contenido de la nota
      let query: string;
      let params: any[];
      
      if (!agente) {
        // Nota sin agente y sin fecha
        query = `DELETE FROM prefapp_notas WHERE smp = $1 AND agente IS NULL AND fecha IS NULL AND notas = $2`;
        params = [smp, contenidoNota];
      } else {
        // Nota con agente pero sin fecha
        query = `DELETE FROM prefapp_notas WHERE smp = $1 AND agente = $2 AND fecha IS NULL AND notas = $3`;
        params = [smp, agente, contenidoNota];
      }
      
      const result = await pool.query(query, params);
      const rowCount = result.rowCount || 0;
      
      if (rowCount === 0) {
        return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    }

    // Validar que la fecha existe y no es null/undefined
    if (!fecha || fecha === null || fecha === undefined || fecha === 'null' || fecha === 'undefined') {
      console.error('❌ Fecha inválida recibida:', { fecha, tipo: typeof fecha });
      return NextResponse.json({ error: "La fecha es requerida y debe ser válida" }, { status: 400 });
    }

    // ✅ Normalizar formato de fecha (YYYY-MM-DD)
    let fechaNormalizada: string;
    try {
      if (fecha instanceof Date) {
        fechaNormalizada = fecha.toISOString().split('T')[0];
      } else if (typeof fecha === 'string') {
        // Validar que no sea el string "null" o "undefined"
        if (fecha === 'null' || fecha === 'undefined' || fecha.trim() === '') {
          throw new Error('Fecha inválida: string vacío o "null"');
        }
        // Si viene como string, extraer solo la parte de fecha (YYYY-MM-DD)
        fechaNormalizada = fecha.split('T')[0].split(' ')[0];
        // Validar formato básico (debe tener al menos 10 caracteres para YYYY-MM-DD)
        if (fechaNormalizada.length < 10 || !/^\d{4}-\d{2}-\d{2}/.test(fechaNormalizada)) {
          throw new Error('Formato de fecha inválido: debe ser YYYY-MM-DD');
        }
      } else {
        throw new Error(`Tipo de fecha no soportado: ${typeof fecha}`);
      }
    } catch (dateError) {
      console.error('❌ Error al normalizar fecha:', dateError, { fecha, tipo: typeof fecha });
      return NextResponse.json({ 
        error: "Formato de fecha inválido", 
        details: dateError instanceof Error ? dateError.message : 'Error desconocido'
      }, { status: 400 });
    }

    // Eliminar la nota
    // Si el agente es null y es admin, usar IS NULL en la consulta
    let rowCount: number;
    if (!agente && isAdmin) {
      // Admin eliminando nota sin agente
      const result = await pool.query(
        `DELETE FROM prefapp_notas WHERE smp = $1 AND agente IS NULL AND fecha = $2`,
        [smp, fechaNormalizada]
      );
      rowCount = result.rowCount || 0;
    } else if (agente) {
      // Eliminar con agente específico
      const result = await pool.query(
        `DELETE FROM prefapp_notas WHERE smp = $1 AND agente = $2 AND fecha = $3`,
        [smp, agente, fechaNormalizada]
      );
      rowCount = result.rowCount || 0;
    } else {
      return NextResponse.json({ error: "Agente es requerido para eliminar esta nota" }, { status: 400 });
    }

    if (rowCount === 0) {
      return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return NextResponse.json({ 
      error: "Error al eliminar nota", 
      details: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}
