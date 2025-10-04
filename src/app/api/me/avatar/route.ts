import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

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

    // Convertir imagen a base64
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const avatarUrl = `data:${file.type};base64,${base64}`;
      
      // Guardar la URL base64 en la base de datos
      await pool.query('UPDATE public.prefapp_users SET foto_perfil = $1 WHERE "user" = $2', [avatarUrl, userId]);
      
      return NextResponse.json({ success: true, avatarUrl });
    } catch (err) {
      console.error('Error procesando imagen:', err);
      return NextResponse.json({ error: "Error del servidor al procesar imagen" }, { status: 500 });
    }

  } catch (error) {
    console.error('Error general en /api/me/avatar:', error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 