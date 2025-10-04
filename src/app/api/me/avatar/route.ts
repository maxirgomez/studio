import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

export async function POST(req: NextRequest) {
  // Usar la misma lógica que /api/me para consistencia
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ||
                req.headers.get("x-auth-token");
  
  // console.log('🖼️ /api/me/avatar - Token recibido:', token ? 'SÍ' : 'NO');
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

  // Crear carpeta si no existe
  await fs.mkdir(AVATAR_DIR, { recursive: true });
  const ext = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${ext}`;
  const filePath = path.join(AVATAR_DIR, fileName);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Guardar la URL en la base
  const avatarUrl = `/avatars/${fileName}`;
  await pool.query('UPDATE public.prefapp_users SET foto_perfil = $1 WHERE "user" = $2', [avatarUrl, userId]);

  return NextResponse.json({ success: true, avatarUrl });
} 