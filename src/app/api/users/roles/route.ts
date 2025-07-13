import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT DISTINCT rol FROM public.prefapp_users WHERE rol IS NOT NULL ORDER BY rol');
    const roles = rows.map(r => r.rol);
    return NextResponse.json({ roles });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener roles', details: (error as Error).message }, { status: 500 });
  }
} 