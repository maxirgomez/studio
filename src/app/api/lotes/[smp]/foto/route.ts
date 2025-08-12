import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { smp: string } }) {
  const smp = params.smp;
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
  }

  // Validación de seguridad: verificar que el usuario tenga permisos para editar este lote
  try {
    // Obtener información del usuario actual desde la sesión
    const userResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/me`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });
    
    if (!userResponse.ok) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }
    
    const userData = await userResponse.json();
    const currentUser = userData.user;
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Obtener información del lote para verificar permisos
    const { rows: loteRows } = await pool.query(
      `SELECT agente FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1`,
      [smp]
    );
    
    if (loteRows.length === 0) {
      return NextResponse.json({ error: 'Lote no encontrado' }, { status: 404 });
    }
    
    const lote = loteRows[0];
    const agenteValue = lote.agente;
    const currentUserValue = currentUser.user;

    // Solo los administradores tienen acceso total
    const isAdmin = currentUser?.rol === 'Administrador';
    
    // El usuario asignado al lote también puede editarlo
    const isAssignedAgent = currentUserValue && agenteValue &&
        currentUserValue.toLowerCase() === agenteValue.toLowerCase();
    
    if (!isAdmin && !isAssignedAgent) {
      return NextResponse.json({ 
        error: 'Acceso denegado. Solo el agente asignado o un administrador pueden editar este lote.' 
      }, { status: 403 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error al validar permisos de usuario' 
    }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Archivo no recibido' }, { status: 400 });
  }

  // Obtener extensión
  const originalName = file.name || 'foto';
  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${smp}${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, fileName);

  // Crear carpeta si no existe
  await fs.mkdir(uploadDir, { recursive: true });

  // Guardar archivo
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  // Devolver URL pública
  const publicUrl = `/uploads/${fileName}`;
  return NextResponse.json({ url: publicUrl });
} 