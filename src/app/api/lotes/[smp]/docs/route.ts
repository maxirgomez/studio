import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "docs"); // Cambiado a public
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function GET(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  if (!smp) return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  try {
    const { rows } = await pool.query(
      `SELECT smp, ruta, agente, fecha FROM prefapp_docs WHERE smp = $1 ORDER BY fecha DESC`,
      [smp]
    );
    return NextResponse.json({ docs: rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener docs", details: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: any) {
  const awaitedParams = typeof params?.then === "function" ? await params : params;
  const smp = awaitedParams?.smp;
  console.log("[DOCS][POST] smp:", smp);
  if (!smp) return NextResponse.json({ error: "SMP no especificado" }, { status: 400 });
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    console.log("[DOCS][POST] Token inválido o expirado");
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
  const agente = typeof payload === 'object' && 'user' in payload ? payload.user : null;
  console.log("[DOCS][POST] agente:", agente);
  if (!agente) return NextResponse.json({ error: "Usuario no encontrado en el token" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    console.log("[DOCS][POST] No se recibió archivo");
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }
  console.log("[DOCS][POST] file.type:", file.type, "file.size:", file.size);
  if (file.type !== "application/pdf") {
    console.log("[DOCS][POST] Tipo de archivo inválido:", file.type);
    return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    console.log("[DOCS][POST] Archivo demasiado grande:", file.size);
    return NextResponse.json({ error: `El archivo supera el tamaño máximo de ${MAX_SIZE / 1024 / 1024}MB` }, { status: 400 });
  }

  await ensureUploadDir();
  const ext = ".pdf";
  const now = new Date();
  const dia = now.getDate().toString().padStart(2, '0');
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const anio = now.getFullYear();
  const safeName = `${smp}-${agente}-${dia}${mes}${anio}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  const ruta = `uploads/docs/${safeName}`; // Cambiado: no incluye /public
  console.log("[DOCS][POST] Guardando archivo en:", filePath);
  try {
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  } catch (err) {
    console.log("[DOCS][POST] Error al guardar archivo:", err);
    return NextResponse.json({ error: "Error al guardar archivo" }, { status: 500 });
  }

  // Guardar en la base
  const fecha = now.toISOString().slice(0, 10);
  try {
    await pool.query(
      `INSERT INTO prefapp_docs (smp, ruta, agente, fecha) VALUES ($1, $2, $3, $4)`,
      [smp, ruta, agente, fecha]
    );
    console.log("[DOCS][POST] Registro insertado en prefapp_docs:", { smp, ruta, agente, fecha });
    return NextResponse.json({ success: true, ruta, agente, fecha });
  } catch (error) {
    console.log("[DOCS][POST] Error al guardar en la base:", error);
    await fs.unlink(filePath).catch(() => {});
    return NextResponse.json({ error: "Error al guardar en la base", details: (error as Error).message }, { status: 500 });
  }
} 