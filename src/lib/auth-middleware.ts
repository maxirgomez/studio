import { NextRequest, NextResponse } from "next/server";
import { 
  extractAndValidateToken, 
  validateEndpointAccess, 
  checkRateLimit,
  applySecurityHeaders,
  AuthenticatedUser 
} from "./security";

export interface AuthContext {
  user: AuthenticatedUser;
  isAuthenticated: boolean;
}

// Función para crear middleware de autenticación
export function createAuthMiddleware(options: {
  requireAuth?: boolean;
  requiredRole?: string;
  requiredResource?: string;
  requiredAction?: string;
  rateLimit?: boolean;
} = {}) {
  return async function authMiddleware(req: NextRequest): Promise<NextResponse | AuthContext> {
    const {
      requireAuth = true,
      requiredRole,
      requiredResource,
      requiredAction,
      rateLimit = true
    } = options;

    // Aplicar headers de seguridad
    const response = NextResponse.next();
    applySecurityHeaders(response);

    // Verificar rate limiting si está habilitado
    if (rateLimit) {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      if (!checkRateLimit(clientIP)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta nuevamente más tarde." },
          { status: 429 }
        );
      }
    }

    // Si no requiere autenticación, continuar
    if (!requireAuth) {
      return { user: null as any, isAuthenticated: false };
    }

    // Extraer y validar token
    const user = extractAndValidateToken(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar rol requerido
    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      );
    }

    // Verificar permisos específicos de recurso
    if (requiredResource && requiredAction) {
      const hasAccess = await validateEndpointAccess(user, requiredResource, requiredAction);
      
      if (!hasAccess) {
        return NextResponse.json(
          { error: "Acceso denegado a este recurso" },
          { status: 403 }
        );
      }
    }

    return { user, isAuthenticated: true };
  };
}

// Middleware específico para endpoints de lotes
export async function lotesAuthMiddleware(req: NextRequest, smp?: string): Promise<NextResponse | AuthContext> {
  const authResult = await createAuthMiddleware({
    requireAuth: true,
    requiredResource: 'lotes',
    requiredAction: 'read'
  })(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Si se especifica un SMP, verificar permisos específicos del lote
  if (smp) {
    // Esta validación se puede hacer en el endpoint específico
    // donde se tiene acceso a la base de datos
  }

  return authResult;
}

// Middleware para endpoints de administración
export async function adminAuthMiddleware(req: NextRequest): Promise<NextResponse | AuthContext> {
  return createAuthMiddleware({
    requireAuth: true,
    requiredRole: 'Administrador'
  })(req);
}

// Middleware para endpoints públicos con rate limiting
export async function publicRateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente más tarde." },
      { status: 429 }
    );
  }

  return null;
}

// Función helper para extraer usuario de request
export function getUserFromRequest(req: NextRequest): AuthenticatedUser | null {
  return extractAndValidateToken(req);
}

// Función para validar que el usuario puede acceder a un lote específico
export async function validateLoteAccess(
  user: AuthenticatedUser, 
  smp: string, 
  action: string = 'read'
): Promise<{ hasAccess: boolean; reason?: string }> {
  try {
    // Los administradores tienen acceso total
    if (user.role === 'Administrador') {
      return { hasAccess: true };
    }

    // Importar pool dinámicamente para evitar dependencias circulares
    const { default: pool } = await import('./db');
    
    // Verificar si el usuario es el agente asignado al lote
    const { rows } = await pool.query(
      'SELECT agente FROM public.prefapp_lotes WHERE smp = $1 LIMIT 1',
      [smp]
    );

    if (rows.length === 0) {
      return { hasAccess: false, reason: 'Lote no encontrado' };
    }

    const lote = rows[0];
    const isAssignedAgent = lote.agente && 
      user.user.toLowerCase() === lote.agente.toLowerCase();

    if (isAssignedAgent) {
      return { hasAccess: true };
    }

    // Verificar permisos por rol
    const hasPermission = await validateEndpointAccess(user, 'lotes', action);
    
    if (hasPermission) {
      return { hasAccess: true };
    }

    return { 
      hasAccess: false, 
      reason: 'Solo el agente asignado o un administrador pueden acceder a este lote' 
    };

  } catch (error) {
    console.error(`[AUTH] Error validando acceso al lote ${smp}:`, error);
    return { hasAccess: false, reason: 'Error interno' };
  }
}
