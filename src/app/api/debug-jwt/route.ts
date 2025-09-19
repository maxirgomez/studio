import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasJwtSecret: !!jwtSecret,
    jwtSecretLength: jwtSecret?.length || 0,
    isDefaultSecret: jwtSecret === 'dev_secret',
    environment: process.env.NODE_ENV,
    message: jwtSecret === 'dev_secret' 
      ? '⚠️ ADVERTENCIA: Estás usando el JWT_SECRET por defecto. Cambia esto en producción.'
      : (jwtSecret?.length ?? 0) >= 64 
        ? '✅ JWT_SECRET configurado correctamente'
        : '❌ JWT_SECRET demasiado corto o no configurado'
  });
}
