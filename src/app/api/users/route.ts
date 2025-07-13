import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const userSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  user: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  mail: z.string().email("Email inválido"),
  rol: z.string().min(2, "El rol es obligatorio"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  // foto_perfil es opcional
});

export async function POST(req: NextRequest) {
  try {
    // Procesar multipart/form-data
    const formData = await req.formData();
    const nombre = formData.get("nombre");
    const apellido = formData.get("apellido");
    const user = formData.get("user");
    const mail = formData.get("mail");
    const rol = formData.get("rol");
    const password = formData.get("password");
    const avatar = formData.get("avatar");

    // Validar campos
    const parsed = userSchema.safeParse({ nombre, apellido, user, mail, rol, password });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Validar unicidad de email
    const emailCheck = await pool.query('SELECT 1 FROM public.prefapp_users WHERE mail = $1', [mail]);
    if ((emailCheck.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    // Validar unicidad de username
    const userCheck = await pool.query('SELECT 1 FROM public.prefapp_users WHERE "user" = $1', [user]);
    if ((userCheck.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "El nombre de usuario ya está registrado" }, { status: 409 });
    }
    // Encriptar contraseña
    const hash = await bcrypt.hash(password as string, 10);

    // Procesar imagen si existe
    let foto_perfil = null;
    if (avatar && typeof avatar === "object" && "arrayBuffer" in avatar) {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      const ext = (avatar.name?.split(".").pop() || "png").toLowerCase();
      const fileName = `${user}_${Date.now()}_${randomUUID()}.${ext}`;
      const avatarsDir = path.join(process.cwd(), "public", "avatars");
      await fs.mkdir(avatarsDir, { recursive: true });
      const filePath = path.join(avatarsDir, fileName);
      await fs.writeFile(filePath, buffer);
      foto_perfil = `/avatars/${fileName}`;
    }

    // Insertar usuario
    await pool.query(
      'INSERT INTO public.prefapp_users (nombre, apellido, "user", mail, rol, password, foto_perfil) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [nombre, apellido, user, mail, rol, hash, foto_perfil]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userParam = req.nextUrl.searchParams.get("user");
    if (userParam) {
      const { rows } = await pool.query('SELECT * FROM public.prefapp_users WHERE "user" = $1 LIMIT 1', [userParam]);
      if (rows.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      // Traer estados y conteo para este usuario
      const { rows: estadosRows } = await pool.query('SELECT DISTINCT estado FROM public.prefapp_lotes WHERE estado IS NOT NULL');
      const estadosDisponibles = estadosRows.map(r => r.estado);
      const { rows: conteoRows } = await pool.query(
        'SELECT estado, COUNT(*) as cantidad FROM public.prefapp_lotes WHERE agente = $1 GROUP BY estado',
        [userParam]
      );
      const estados = conteoRows.map(r => ({ estado: r.estado, cantidad: Number(r.cantidad) }));
      return NextResponse.json({ user: { ...rows[0], estados, estadosDisponibles } });
    } else {
      // Traer todos los usuarios
      const { rows } = await pool.query('SELECT * FROM public.prefapp_users ORDER BY rol, nombre, apellido');
      // Traer todos los estados posibles
      const { rows: estadosRows } = await pool.query('SELECT DISTINCT estado FROM public.prefapp_lotes WHERE estado IS NOT NULL');
      const estadosDisponibles = estadosRows.map(r => r.estado);
      // Para cada usuario, traer el conteo de lotes por estado
      const usersWithEstados = await Promise.all(rows.map(async (user) => {
        const { rows: conteoRows } = await pool.query(
          'SELECT estado, COUNT(*) as cantidad FROM public.prefapp_lotes WHERE agente = $1 GROUP BY estado',
          [user.user]
        );
        const estados = conteoRows.map(r => ({ estado: r.estado, cantidad: Number(r.cantidad) }));
        return { ...user, estados, estadosDisponibles };
      }));
      return NextResponse.json({ users: usersWithEstados });
    }
  } catch (err) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const username = data.user || data.username;
    if (!username) {
      return NextResponse.json({ error: "Falta el identificador de usuario" }, { status: 400 });
    }
    // Construir los campos a actualizar
    const updates = [];
    const values = [];
    if (data.nombre) {
      updates.push('nombre = $' + (values.length + 1));
      values.push(data.nombre);
    }
    if (data.apellido) {
      updates.push('apellido = $' + (values.length + 1));
      values.push(data.apellido);
    }
    if (data.mail) {
      // Validar unicidad de email
      const emailCheck = await pool.query('SELECT 1 FROM public.prefapp_users WHERE mail = $1 AND "user" <> $2', [data.mail, username]);
      if ((emailCheck.rowCount ?? 0) > 0) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
      }
      updates.push('mail = $' + (values.length + 1));
      values.push(data.mail);
    }
    if (data.rol) {
      updates.push('rol = $' + (values.length + 1));
      values.push(data.rol);
    }
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 10);
      updates.push('password = $' + (values.length + 1));
      values.push(hash);
    }
    if (data.foto_perfil) {
      updates.push('foto_perfil = $' + (values.length + 1));
      values.push(data.foto_perfil);
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }
    values.push(username);
    const query = `UPDATE public.prefapp_users SET ${updates.join(", ")} WHERE "user" = $${values.length}`;
    await pool.query(query, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
} 