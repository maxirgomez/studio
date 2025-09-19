import { NextRequest, NextResponse } from 'next/server';
import { extractAndValidateToken, applySecurityHeaders, checkRateLimit } from './src/lib/security';

// Validar JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret') {
  console.warn('⚠️  JWT_SECRET no está configurado correctamente. Usar un valor seguro en producción.');
}

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
  '/api/reset-password-request',
  '/api/me', // Permitir acceso a /api/me sin redirección
  '/api/debug-rate-limit', // Endpoint de debug
  '/api/debug-auth', // Endpoint de debug de autenticación
];

// Rutas de API que requieren autenticación pero no redirección
const API_PATHS = [
  '/api/',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Aplicar headers de seguridad a todas las respuestas
  const response = NextResponse.next();
  applySecurityHeaders(response);
  
  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return response;
  }

  // Verificar rate limiting para rutas de API (excepto /api/me)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/me')) {
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta nuevamente más tarde." },
        { status: 429 }
      );
    }
  }

  // Verificar autenticación
  const user = extractAndValidateToken(req);
  
  if (!user) {
    // Si es una ruta de API, devolver error JSON
    if (API_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }
    
    // Para rutas de página, redirigir a login
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Token válido, permitir acceso
  return response;
}

export const config = {
  matcher: [
    // Proteger todas las rutas excepto las públicas
    '/((?!_next|favicon.ico|login|api/login|api/me|api/public|api/test-db|api/reset-password-request|api/debug-rate-limit|api/debug-auth).*)',
  ],
}; 