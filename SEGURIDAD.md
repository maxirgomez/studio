# 🛡️ Guía de Seguridad - PrefApp

## Resumen de Mejoras Implementadas

### 🔐 **Base de Datos (PostgreSQL)**

#### **Mejoras de Seguridad:**
- ✅ **Validación de variables de entorno** - Verificación obligatoria de credenciales
- ✅ **Configuración SSL** - Conexiones encriptadas en producción
- ✅ **Timeouts de consulta** - Prevención de consultas colgadas
- ✅ **Sanitización de entrada** - Prevención de inyección SQL
- ✅ **Auditoría de consultas** - Logging de todas las operaciones
- ✅ **Sistema de permisos** - Control de acceso basado en roles
- ✅ **Pools de conexión seguros** - Límites y configuraciones de seguridad

#### **Configuraciones Aplicadas:**
```typescript
// Timeouts y límites
connectionTimeoutMillis: 10000
idleTimeoutMillis: 30000
statement_timeout: 30000
query_timeout: 30000

// SSL en producción
ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false

// Aplicación identificada
application_name: "prefapp-api"
```

### 🔑 **Autenticación y Autorización**

#### **JWT Seguro:**
- ✅ **Secret fuerte** - Validación de JWT_SECRET
- ✅ **Algoritmo específico** - HS256
- ✅ **Expiración configurable** - Por defecto 1 hora
- ✅ **Payload validado** - Estructura verificada

#### **Rate Limiting:**
- ✅ **Límite por IP** - 5 intentos por 15 minutos
- ✅ **Limpieza automática** - Eliminación de límites expirados
- ✅ **Aplicado globalmente** - En middleware y endpoints críticos

#### **Validación de Entrada:**
- ✅ **Sanitización** - Remoción de caracteres peligrosos
- ✅ **Validación de formato** - Email y username
- ✅ **Prevención de inyección** - Múltiples capas de protección

### 🌐 **API y Middleware**

#### **Headers de Seguridad:**
```typescript
'X-Content-Type-Options': 'nosniff'
'X-Frame-Options': 'DENY'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
```

#### **Cookies Seguras:**
- ✅ **HttpOnly** - No accesible desde JavaScript
- ✅ **Secure** - Solo HTTPS en producción
- ✅ **SameSite: strict** - Protección CSRF
- ✅ **Expiración** - 1 hora por defecto

### 📊 **Sistema de Permisos**

#### **Roles Definidos:**
- **Administrador** - Acceso total
- **Supervisor** - Gestión de lotes y usuarios
- **Agente** - Acceso limitado a sus lotes

#### **Recursos Protegidos:**
- **Lotes** - read, update_own, create, update
- **Documentos** - read, upload_own, delete_own, upload, delete
- **Usuarios** - read_own, read, update

## 🚀 **Configuración para Producción**

### **1. Variables de Entorno Requeridas:**

```bash
# Base de Datos
DB_HOST=tu_host_db
DB_PORT=5432
DB_NAME=prefapp
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_seguro

# Seguridad
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo_minimo_32_caracteres
JWT_EXPIRES_IN=1h

# Aplicación
NODE_ENV=production
```

### **2. Generar JWT_SECRET Seguro:**

```bash
node scripts/generate-jwt-secret.js
```

### **3. Configuración de PostgreSQL:**

```sql
-- Crear usuario específico para la aplicación
CREATE USER prefapp_user WITH PASSWORD 'password_seguro';

-- Otorgar permisos mínimos necesarios
GRANT CONNECT ON DATABASE prefapp TO prefapp_user;
GRANT USAGE ON SCHEMA public TO prefapp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO prefapp_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO prefapp_user;

-- Configurar SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
```

### **4. Configuración de Nginx (Recomendado):**

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 **Monitoreo y Auditoría**

### **Logs de Seguridad:**
- ✅ **Intentos de login** - Exitosos y fallidos
- ✅ **Consultas a BD** - Con duración y usuario
- ✅ **Errores de permisos** - Accesos denegados
- ✅ **Rate limiting** - Intentos bloqueados

### **Métricas Recomendadas:**
- Intentos de login fallidos por IP
- Consultas lentas (>5 segundos)
- Errores de permisos por usuario
- Uso de memoria de pools de conexión

## ⚠️ **Recomendaciones Adicionales**

### **1. Backup y Recuperación:**
```bash
# Backup diario
pg_dump -h localhost -U prefapp_user -d prefapp > backup_$(date +%Y%m%d).sql

# Backup incremental con WAL
pg_basebackup -h localhost -U prefapp_user -D /backup/location
```

### **2. Monitoreo de Seguridad:**
- Implementar alertas para múltiples intentos de login fallidos
- Monitorear consultas inusuales o lentas
- Revisar logs de acceso regularmente
- Actualizar dependencias regularmente

### **3. Configuración de Firewall:**
```bash
# Solo permitir conexiones desde la aplicación
ufw allow from 127.0.0.1 to any port 5432
ufw allow from tu_ip_aplicacion to any port 5432
ufw deny 5432
```

### **4. Rotación de Credenciales:**
- Cambiar contraseñas de BD cada 90 días
- Rotar JWT_SECRET cada 6 meses
- Implementar notificaciones de expiración

## 🚨 **Checklist de Seguridad Pre-Despliegue**

- [ ] JWT_SECRET configurado y seguro
- [ ] Variables de entorno protegidas
- [ ] SSL configurado en PostgreSQL
- [ ] Usuario de BD con permisos mínimos
- [ ] Rate limiting configurado
- [ ] Headers de seguridad aplicados
- [ ] Logs de auditoría habilitados
- [ ] Backup configurado
- [ ] Firewall configurado
- [ ] Monitoreo implementado

## 📞 **Contacto de Seguridad**

En caso de detectar vulnerabilidades o problemas de seguridad:
1. No reportar públicamente
2. Contactar al administrador del sistema
3. Documentar el problema
4. Aplicar parches inmediatamente
5. Revisar logs para actividad sospechosa

---

**Última actualización:** $(date)
**Versión:** 1.0
**Estado:** Implementado ✅
