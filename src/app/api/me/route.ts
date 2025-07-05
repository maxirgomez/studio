import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return NextResponse.json({ user: payload });
  } catch (err) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
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
  const { firstName, lastName, email, password } = await req.json();
  const nombre = `${firstName} ${lastName}`.trim();
  const updates = [];
  const values = [];
  if (nombre) {
    updates.push('nombre = $' + (values.length + 1));
    values.push(nombre);
  }
  if (email) {
    updates.push('mail = $' + (values.length + 1));
    values.push(email);
  }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    updates.push('password = $' + (values.length + 1));
    values.push(hash);
  }
  if (updates.length === 0) {
    return NextResponse.json({ success: false, message: "Sin cambios" });
  }
  // user es único
  values.push(userId);
  const query = `UPDATE public.prefapp_users SET ${updates.join(", ")} WHERE "user" = $${values.length}`;
  await pool.query(query, values);
  return NextResponse.json({ success: true });
} 