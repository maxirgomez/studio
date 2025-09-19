import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { sendResetPasswordEmail } from "@/lib/server/sendResetPasswordEmail";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const APP_URL = process.env.APP_URL || "http://localhost:9002";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Buscar usuario por email
    const { rows } = await pool.query('SELECT "user", mail FROM public.prefapp_users WHERE mail = $1', [email]);
    
    if (rows.length === 0) {
      // No revelar si existe o no
      return NextResponse.json({ success: true });
    }
    
    const user = rows[0];
    
    // Verificar que JWT_SECRET esté configurado
    if (!JWT_SECRET || JWT_SECRET === "dev_secret") {
      console.error("JWT_SECRET no está configurado correctamente");
      return NextResponse.json({ error: "Configuración de seguridad faltante" }, { status: 500 });
    }
    
    // Generar token JWT válido por 1 hora
    const token = jwt.sign({ user: user.user, mail: user.mail }, JWT_SECRET, { expiresIn: "1h" });
    const resetLink = `${APP_URL}/reset-password?token=${token}`;
    
    await sendResetPasswordEmail(user.mail, resetLink);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error en reset-password-request:", err);
    return NextResponse.json({ 
      error: "Error al procesar la solicitud",
      details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
    }, { status: 500 });
  }
} 