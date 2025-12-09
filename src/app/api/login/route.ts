import { NextRequest, NextResponse } from "next/server";
import pool, { createUserPool, testUserConnection, executeQueryWithAudit } from "@/lib/db";
import { 
  generateSecureToken, 
  hashPassword, 
  verifyPassword, 
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  checkRateLimit,
  applySecurityHeaders,
  AuthenticatedUser 
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    // Verificar rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Demasiados intentos de login. Intenta nuevamente más tarde." },
        { status: 429 }
      );
    }

    const { usuarioOEmail, password } = await req.json();
    
    // Sanitizar entrada
    const sanitizedUser = sanitizeInput(usuarioOEmail);
    const sanitizedPassword = sanitizeInput(password);
    
    if (!sanitizedUser || !sanitizedPassword) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    // Validar formato de entrada
    const isEmail = isValidEmail(sanitizedUser);
    const isUsername = isValidUsername(sanitizedUser);
    
    if (!isEmail && !isUsername) {
      return NextResponse.json({ error: "Formato de usuario o email inválido" }, { status: 400 });
    }
    
    // Primero, intentar conectar directamente con las credenciales del usuario
    let connectionSuccess = false;
    try {
      connectionSuccess = await testUserConnection(sanitizedUser, sanitizedPassword);
    } catch (err) {
      // Si el método lanza, lo tratamos como fallo de auth en lugar de 500
      connectionSuccess = false;
    }
    
    if (!connectionSuccess) {
      // Si la autenticación directa falla, buscar en la tabla de usuarios
      const query = `SELECT * FROM public.prefapp_users WHERE "user" = $1 OR mail = $1 LIMIT 1`;
      
      const { rows } = await executeQueryWithAudit(query, [sanitizedUser], 'system', 'LOGIN_ATTEMPT');
      
      if (rows.length === 0) {
        return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
      }
      
      const user = rows[0];

      // Verificar si el usuario está bloqueado
      if (user.lock_until && new Date(user.lock_until) > new Date()) {
        return NextResponse.json({ error: `Demasiados intentos fallidos. Intenta nuevamente después de ${user.lock_until}` }, { status: 403 });
      }
      
      // Validar contraseña usando bcrypt
      // Si no hay hash almacenado, rechazar
      if (!user.password) {
        return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
      }

      const passwordMatch = await verifyPassword(sanitizedPassword, user.password);
      
      if (!passwordMatch) {
        // Incrementar failed_attempts
        const failedAttempts = (user.failed_attempts || 0) + 1;
        let lockUntil = null;
        if (failedAttempts >= 5) {
          lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
        }
        
        await pool.query(
          'UPDATE public.prefapp_users SET failed_attempts = $1, lock_until = $2 WHERE "user" = $3 OR mail = $3',
          [failedAttempts, lockUntil, user.user || user.mail]
        );
        if (lockUntil) {
          return NextResponse.json({ error: `Demasiados intentos fallidos. Intenta nuevamente después de ${lockUntil.toLocaleString()}` }, { status: 403 });
        }
        return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
      }
      
      // Resetear intentos fallidos
      await pool.query(
        'UPDATE public.prefapp_users SET failed_attempts = 0, lock_until = NULL WHERE "user" = $1 OR mail = $1',
        [user.user || user.mail]
      );
      
      // Crear payload del usuario
      const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
      const iniciales = `${(user.nombre?.[0] || '').toUpperCase()}${(user.apellido?.[0] || '').toUpperCase()}`;
      const payload = {
        user: user.user,
        mail: user.mail,
        nombre: nombreCompleto,
        apellido: user.apellido,
        role: user.rol || null,
        avatarUrl: user.foto_perfil || null,
        aiHint: user.aihint || user.aiHint || null,
        initials: iniciales,
        lots: user.lots || null,
      };
      
      // Generar JWT seguro
      const token = generateSecureToken(payload);
      
      // Enviar respuesta con token en JSON (sin cookies)
      const response = NextResponse.json({ 
        success: true, 
        user: payload,
        token: token // Token en el response para que el cliente lo maneje
      });
      applySecurityHeaders(response);
      
      return response;
    }
    
    // Si llegamos aquí, la autenticación directa fue exitosa
    // Crear pool con las credenciales del usuario para obtener su información
    const userPool = createUserPool(sanitizedUser, sanitizedPassword);
    const { rows } = await userPool.query(`SELECT * FROM public.prefapp_users WHERE "user" = $1 OR mail = $1 LIMIT 1`, [sanitizedUser]);
    await userPool.end();
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado en el sistema" }, { status: 401 });
    }
    
    const user = rows[0];

    // Generar JWT (expira en 1 hora)
    const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();
    const iniciales = `${(user.nombre?.[0] || '').toUpperCase()}${(user.apellido?.[0] || '').toUpperCase()}`;
    const payload = {
      user: user.user,
      mail: user.mail,
      nombre: nombreCompleto,
      apellido: user.apellido,
      role: user.rol || null,
      avatarUrl: user.foto_perfil || null,
      aiHint: user.aihint || user.aiHint || null,
      initials: iniciales,
      lots: user.lots || null,
    };
    const token = generateSecureToken(payload);

    // Enviar el token en JSON (sin cookies)
    const response = NextResponse.json({ 
      success: true, 
      user: payload,
      token: token // Token en el response para que el cliente lo maneje
    });
    applySecurityHeaders(response);
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 