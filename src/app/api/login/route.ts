import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function POST(req: NextRequest) {
  try {
    const { usuarioOEmail, password } = await req.json();
    if (!usuarioOEmail || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    // Buscar el usuario por user o mail
    const query = `SELECT * FROM public.prefapp_users WHERE "user" = $1 OR mail = $1 LIMIT 1`;
    const { rows } = await pool.query(query, [usuarioOEmail]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }
    const user = rows[0];

    // Verificar si el usuario está bloqueado
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return NextResponse.json({ error: `Demasiados intentos fallidos. Intenta nuevamente después de ${user.lock_until}` }, { status: 403 });
    }

    // Validar contraseña usando bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      // Incrementar failed_attempts
      const failedAttempts = (user.failed_attempts || 0) + 1;
      let lockUntil = null;
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
      }
      await pool.query(
        'UPDATE public.prefapp_users SET failed_attempts = $1, lock_until = $2 WHERE "user" = $3 OR mail = $3',
        [failedAttempts, lockUntil, user.user || user.mail]
      );
      if (lockUntil) {
        return NextResponse.json({ error: `Demasiados intentos fallidos. Intenta nuevamente después de ${lockUntil.toLocaleString()}` }, { status: 403 });
      }
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    // Login exitoso: resetear failed_attempts y lock_until
    await pool.query(
      'UPDATE public.prefapp_users SET failed_attempts = 0, lock_until = NULL WHERE "user" = $1 OR mail = $1',
      [user.user || user.mail]
    );

    // Generar JWT (expira en 1 hora)
    const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
    const iniciales = `${(user.nombre?.[0] || '').toUpperCase()}${(user.apellido?.[0] || '').toUpperCase()}`;
    const payload = {
      user: user.user,
      mail: user.mail,
      nombre: nombreCompleto,
      apellido: user.apellido,
      role: user.role || null,
      avatarUrl: user.foto_perfil || null,
      aiHint: user.aihint || user.aiHint || null,
      initials: iniciales,
      lots: user.lots || null,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded && decoded.exp) {
      const expDate = new Date(decoded.exp * 1000);
    } else {
    }

    // Enviar el token en una cookie httpOnly
    const response = NextResponse.json({ success: true, user: payload });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hora
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 