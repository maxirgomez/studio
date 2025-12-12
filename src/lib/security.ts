import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// Validar JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret') {
  throw new Error("JWT_SECRET debe estar configurado y ser seguro en producción");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// Rate limiting simple en memoria (en producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutos (reducido)
const RATE_LIMIT_MAX_ATTEMPTS = 20; // Aumentado para producción

export interface AuthenticatedUser {
  user: string;
  mail: string;
  nombre: string;
  apellido: string;
  role: string | null;
  avatarUrl: string | null;
  aiHint: string | null;
  initials: string;
  lots: string | null;
}

// Función para verificar rate limiting
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  // Limpieza on-demand para Edge Runtime
  if (rateLimitMap.size > 1000) {
    cleanupRateLimits();
  }
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset o primera vez
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false; // Rate limit excedido
  }
  
  userLimit.count++;
  return true;
}

// Función para limpiar rate limits expirados
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Limpiar rate limits cada 5 minutos
// NOTA: setInterval no funciona en Edge Runtime de Vercel
// La limpieza se hace on-demand en checkRateLimit
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

// Función para extraer y validar token JWT
export function extractAndValidateToken(req: NextRequest): AuthenticatedUser | null {
  try {
    // Buscar token en cookies primero (para compatibilidad)
    let token = req.cookies.get("token")?.value;
    // console.log('🔓 extractAndValidateToken - Cookie token:', token ? 'presente' : 'ausente');
    
    // Si no hay token en cookies, buscar en headers de Authorization
    if (!token) {
      const authHeader = req.headers.get("authorization");
      // console.log('🔓 extractAndValidateToken - Authorization header:', authHeader ? 'presente' : 'ausente');
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remover "Bearer "
        // console.log('🔓 extractAndValidateToken - Token extraído de header');
      }
    }
    
    if (!token) {
      // console.log('🔓 extractAndValidateToken - No se encontró token');
      return null;
    }
    
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // console.log('🔓 extractAndValidateToken - Token verificado exitosamente');
    
    // Validar estructura del payload
    if (!payload.user || !payload.mail) {
      // console.log('🔓 extractAndValidateToken - Payload inválido (falta user o mail)');
      return null;
    }
    
    return payload as AuthenticatedUser;
  } catch (error) {
    console.error('🔓 extractAndValidateToken - Error:', error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}

// Función para generar token JWT seguro
export function generateSecureToken(user: AuthenticatedUser): string {
  const payload = {
    ...user,
    iat: Math.floor(Date.now() / 1000),
    iss: "prefapp-api"
  };
  
  const options: jwt.SignOptions = { 
    expiresIn: JWT_EXPIRES_IN as any,
    algorithm: "HS256"
  };
  return jwt.sign(payload, JWT_SECRET as string, options);
}

// Función para validar permisos de endpoint
// NOTA: Esta función debe usarse solo en API routes, no en middleware
// ya que requiere acceso a la base de datos
export async function validateEndpointAccess(
  user: AuthenticatedUser, 
  resource: string, 
  action: string,
  resourceId?: string
): Promise<boolean> {
  try {
    // Los administradores tienen acceso total
    if (user.role === 'Administrador') {
      return true;
    }
    
    // Para Edge Runtime, validación básica
    // La validación completa de permisos se hace en los API routes
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge') {
      return true; // Permitir en edge, validar en API route
    }
    
    // Importación dinámica para evitar errores en Edge Runtime
    const { validateUserPermissions } = await import('./db');
    const hasPermission = await validateUserPermissions(user.user, resource, action);
    
    if (!hasPermission) {
      return false;
    }
    
    // Validaciones específicas por recurso
    if (resource === 'lotes' && action === 'update_own' && resourceId) {
      // Verificar que el usuario es el agente asignado al lote
      // Esta validación se hará en el endpoint específico
      return true;
    }
    
    return true;
  } catch (error) {
    console.error(`[SECURITY] Error validando acceso:`, error);
    return false;
  }
}

// Función para sanitizar entrada de usuario
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remover caracteres peligrosos para SQL injection
    return input.replace(/['"\\;-]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Función para validar formato de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para validar formato de usuario
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

// Función para generar hash seguro de contraseña
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12; // Aumentar rounds para mayor seguridad
  return bcrypt.hash(password, saltRounds);
}

// Función para verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

// Headers de seguridad para respuestas
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Función para aplicar headers de seguridad
export function applySecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
