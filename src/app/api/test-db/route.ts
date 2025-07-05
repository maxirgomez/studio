import { NextResponse } from 'next/server';
import { testPostgresConnection } from '@/lib/pg-test';

export async function GET() {
  try {
    await testPostgresConnection();
    return NextResponse.json({ success: true, message: '¡Conexión exitosa a la base de datos PostgreSQL!' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error de conexión', error: String(error) }, { status: 500 });
  }
} 