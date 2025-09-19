import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { hashPassword } from "@/lib/security";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token y nueva contraseña requeridos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Verificar y decodificar el token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    const { user, mail } = decoded;

    // Verificar que el usuario existe
    const { rows } = await pool.query(
      'SELECT "user", mail FROM public.prefapp_users WHERE "user" = $1 AND mail = $2',
      [user, mail]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar la contraseña en la base de datos
    await pool.query(
      'UPDATE public.prefapp_users SET password = $1 WHERE "user" = $2',
      [hashedPassword, user]
    );

    return NextResponse.json({ success: true, message: "Contraseña actualizada exitosamente" });

  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
