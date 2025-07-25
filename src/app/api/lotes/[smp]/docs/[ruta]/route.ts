import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "docs");

export async function DELETE(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  const ruta = awaitedParams?.ruta;
  if (!smp || !ruta) return NextResponse.json({ error: "SMP o ruta no especificados" }, { status: 400 });
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
  const agente = typeof payload === 'object' && 'user' in payload ? payload.user : null;
  const rol = typeof payload === 'object' && 'rol' in payload ? payload.rol : null;
  if (!agente) return NextResponse.json({ error: "Usuario no encontrado en el token" }, { status: 401 });

  // Buscar el registro
  let doc;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM prefapp_docs WHERE smp = $1 AND ruta = $2 LIMIT 1`,
      [smp, `uploads/docs/${ruta}`]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    doc = rows[0];
    
    // Validación de permisos: solo el propietario del documento o un administrador pueden eliminarlo
    const isAdmin = rol === 'Administrador';
    const isOwner = doc.agente === agente;
    
    console.log('[DELETE /api/lotes/[smp]/docs/[ruta]] Validación de permisos:', {
      currentUser: agente,
      currentUserRol: rol,
      docOwner: doc.agente,
      isAdmin: isAdmin,
      isOwner: isOwner
    });
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ 
        error: "No tienes permiso para eliminar este archivo. Solo el propietario del documento o un administrador pueden eliminarlo." 
      }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Error al buscar el documento", details: (error as Error).message }, { status: 500 });
  }

  // Eliminar archivo físico
  const filePath = path.join(UPLOAD_DIR, ruta);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Si el archivo no existe, seguimos
  }

  // Eliminar registro en la base
  try {
    await pool.query(
      `DELETE FROM prefapp_docs WHERE smp = $1 AND ruta = $2`,
      [smp, `uploads/docs/${ruta}`]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar de la base", details: (error as Error).message }, { status: 500 });
  }
} 