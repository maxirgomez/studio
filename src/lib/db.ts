import { Pool } from "pg";

// Validar variables de entorno críticas
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
  throw new Error("Variables de entorno de base de datos requeridas: DB_USER, DB_PASSWORD, DB_HOST");
}

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME || "prefapp",
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20, // máximo de conexiones en el pool
  // Configuraciones de seguridad adicionales
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  application_name: "prefapp-api",
  statement_timeout: 30000, // 30 segundos timeout para consultas
  query_timeout: 30000,
};


// Pool principal usando las variables de entorno
const pool = new Pool(dbConfig);


// Función para crear un pool dinámico con credenciales específicas del usuario
export function createUserPool(username: string, password: string): Pool {
  // Validar entrada para prevenir inyección
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    throw new Error("Credenciales de usuario inválidas");
  }

  // Sanitizar username (solo caracteres alfanuméricos, guiones y guiones bajos)
  const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitizedUsername !== username) {
    throw new Error("Nombre de usuario contiene caracteres no válidos");
  }

  const userPool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || "prefapp",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: sanitizedUsername,
    password: password,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 3, // menos conexiones para pools de usuario
    // Configuraciones de seguridad adicionales
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    application_name: `prefapp-user-${sanitizedUsername}`,
    statement_timeout: 15000, // 15 segundos timeout para consultas de usuario
    query_timeout: 15000,
  });

  return userPool;
}

// Función para probar la conexión con el pool principal
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Función para probar la conexión con credenciales específicas del usuario
export async function testUserConnection(username: string, password: string) {
  const userPool = createUserPool(username, password);
  try {
    const client = await userPool.connect();
    const result = await client.query('SELECT current_user, version()');
    client.release();
    await userPool.end();
    
    // Log de conexión exitosa (sin credenciales)
    console.log(`[DB-AUTH] Conexión exitosa para usuario: ${username}`);
    return true;
  } catch (error) {
    await userPool.end();
    
    // Log de intento fallido (sin credenciales)
    console.log(`[DB-AUTH] Intento de conexión fallido para usuario: ${username}`);
    return false;
  }
}

// Función para ejecutar consultas con auditoría
export async function executeQueryWithAudit(query: string, params: any[] = [], userId?: string, operation?: string) {
  const startTime = Date.now();
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - startTime;
    
    // Log de consulta exitosa
    console.log(`[DB-QUERY] ${operation || 'SELECT'} - Usuario: ${userId || 'system'} - Duración: ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log de error (sin exponer detalles sensibles)
    console.error(`[DB-ERROR] ${operation || 'QUERY'} - Usuario: ${userId || 'system'} - Duración: ${duration}ms - Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    throw error;
  }
}

// Función para validar permisos de usuario en consultas
export async function validateUserPermissions(userId: string, resource: string, action: string): Promise<boolean> {
  try {
    const query = `
      SELECT role FROM public.prefapp_users 
      WHERE "user" = $1 AND role IS NOT NULL
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const userRole = result.rows[0].role;
    
    // Lógica de permisos basada en roles
    if (userRole === 'Administrador') {
      return true; // Los administradores tienen acceso total
    }
    
    // Definir permisos específicos por rol y recurso
    const permissions: Record<string, Record<string, string[]>> = {
      'Agente': {
        'lotes': ['read', 'update_own'],
        'docs': ['read', 'upload_own', 'delete_own'],
        'users': ['read_own']
      },
      'Supervisor': {
        'lotes': ['read', 'update', 'create'],
        'docs': ['read', 'upload', 'delete'],
        'users': ['read', 'update']
      }
    };
    
    const rolePermissions = permissions[userRole] || {};
    const resourcePermissions = rolePermissions[resource] || [];
    
    return resourcePermissions.includes(action);
  } catch (error) {
    console.error(`[DB-PERMISSIONS] Error validando permisos para ${userId}:`, error);
    return false;
  }
}

// Exportar el pool principal como default
export default pool; 