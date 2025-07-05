import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/favicon.ico',
  '/_next',
  '/api/public',
  '/api/test-db',
  '/api/test-db/',
  '/api/test-db/route',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    // No hay token, redirigir a login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    jwt.verify(token, JWT_SECRET);
    // Token válido, permitir acceso
    return NextResponse.next();
  } catch (err) {
    // Token inválido o expirado, redirigir a login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto las públicas
    '/((?!_next|favicon.ico|login|api/login|api/public|api/test-db).*)',
  ],
}; 