import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { smp: string } }) {
  const smp = params.smp;
  if (!smp) {
    return NextResponse.json({ error: 'SMP no especificado' }, { status: 400 });
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