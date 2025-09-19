import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET(req: NextRequest) {
  // Solo obtener token de headers (más simple y confiable)
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ||
                req.headers.get("x-auth-token");
  
  // Debug logs
  console.log('🔍 /api/me - Token recibido:', token ? 'SÍ' : 'NO');
  console.log('🔍 /api/me - Authorization header:', req.headers.get("authorization"));
  
  if (!token) {
    console.log('❌ /api/me - Sin token, devolviendo 401');
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    const userId = typeof payload === 'object' && 'user' in payload ? payload.user : null;
    if (!userId) {
      console.log('❌ /api/me - Token inválido, no contiene user');
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    
    console.log('🔍 /api/me - Buscando usuario:', userId);
    
    // Consultar la base de datos para obtener los datos actuales
    const { rows } = await pool.query(
      'SELECT nombre, mail, "user", apellido, rol, foto_perfil FROM public.prefapp_users WHERE "user" = $1',
      [userId]
    );
    
    if (rows.length === 0) {
      console.log('❌ /api/me - Usuario no encontrado en la base de datos:', userId);
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    
    const user = rows[0];
    console.log('✅ /api/me - Usuario encontrado:', user.user, user.nombre, user.apellido);
    // Si no hay apellido, intentar separar del nombre
    
    let nombre = user.nombre || "";
    let apellido = user.apellido || "";
    if (!apellido && nombre.includes(" ")) {
      const parts = nombre.split(" ");
      apellido = parts.length > 1 ? parts.pop() : "";
      nombre = parts.join(" ");
    }

    // --- AGREGADO: conteo de lotes por estado para este usuario ---
    // 1. Traer todos los estados posibles
    const { rows: estadosRows } = await pool.query('SELECT DISTINCT estado FROM public.prefapp_lotes WHERE estado IS NOT NULL');
    const estadosDisponibles = estadosRows.map(r => r.estado);
    // 2. Contar lotes por estado para este agente
    const { rows: conteoRows } = await pool.query(
      'SELECT estado, COUNT(*) as cantidad FROM public.prefapp_lotes WHERE agente = $1 GROUP BY estado',
      [user.user]
    );
    const estados = conteoRows.map(r => ({ estado: r.estado, cantidad: Number(r.cantidad) }));
    // ---

    return NextResponse.json({
      user: {
        nombre: nombre,
        apellido: apellido,
        mail: user.mail,
        user: user.user,
        rol: user.rol,
        foto_perfil: user.foto_perfil,
        estados,
        estadosDisponibles,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  // Usar la misma lógica que GET para obtener el token
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
  const { nombre, apellido, user, mail, password } = await req.json();
  const updates = [];
  const values = [];
  if (nombre && typeof nombre === 'string' && nombre.trim()) {
    updates.push('nombre = $' + (values.length + 1));
    values.push(nombre.trim());
  }
  if (apellido && typeof apellido === 'string' && apellido.trim()) {
    updates.push('apellido = $' + (values.length + 1));
    values.push(apellido.trim());
  }
  if (user && typeof user === 'string' && user.trim()) {
    updates.push('"user" = $' + (values.length + 1));
    values.push(user.trim());
  }
  if (mail && typeof mail === 'string' && mail.trim()) {
    updates.push('mail = $' + (values.length + 1));
    values.push(mail.trim());
  }
  if (password && typeof password === 'string' && password.trim()) {
    const hash = await bcrypt.hash(password, 10);
    updates.push('password = $' + (values.length + 1));
    values.push(hash);
  }
  if (updates.length === 0) {
    return NextResponse.json({ success: false, message: "Sin cambios" });
  }
  values.push(userId);
  const query = `UPDATE public.prefapp_users SET ${updates.join(", ")} WHERE "user" = $${values.length}`;
  await pool.query(query, values);
  return NextResponse.json({ success: true });
} 