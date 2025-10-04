import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

export async function POST(req: NextRequest) {
  try {
    // Usar la misma lógica que /api/me para consistencia
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ||
                  req.headers.get("x-auth-token");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }
    
    const userId = typeof payload === 'object' && 'user' in payload ? payload.user : null;
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("avatar");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande. Máximo 5MB" }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Solo imágenes JPG, PNG, GIF o WebP" }, { status: 400 });
    }

    // Crear carpeta si no existe
    try {
      await fs.mkdir(AVATAR_DIR, { recursive: true });
    } catch (err) {
      console.error('Error creando directorio de avatares:', err);
      return NextResponse.json({ error: "Error del servidor al crear directorio" }, { status: 500 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${ext}`;
    const filePath = path.join(AVATAR_DIR, fileName);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Error escribiendo archivo:', err);
      return NextResponse.json({ error: "Error del servidor al guardar archivo" }, { status: 500 });
    }

    // Guardar la URL en la base de datos
    const avatarUrl = `/avatars/${fileName}`;
    try {
      await pool.query('UPDATE public.prefapp_users SET foto_perfil = $1 WHERE "user" = $2', [avatarUrl, userId]);
    } catch (err) {
      console.error('Error actualizando base de datos:', err);
      // Intentar eliminar el archivo si falló la BD
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        console.error('Error eliminando archivo tras fallo de BD:', unlinkErr);
      }
      return NextResponse.json({ error: "Error del servidor al actualizar perfil" }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Error general en /api/me/avatar:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 