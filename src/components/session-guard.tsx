"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🛡️ SessionGuard - pathname:', pathname);
    // No chequear sesión en "/" (login) ni rutas públicas
    if (pathname === "/" || pathname.startsWith("/login")) return;
    let expired = false;
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('🛡️ SessionGuard - Token:', token ? 'ENCONTRADO' : 'NO ENCONTRADO');
        
        if (!token) {
          console.log('🛡️ SessionGuard - Sin token, redirigiendo a login');
          if (!expired) {
            expired = true;
            router.push(`/?next=${encodeURIComponent(pathname)}`);
          }
          return;
        }
        
        console.log('🛡️ SessionGuard - Verificando sesión con /api/me...');
        const res = await fetch("/api/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🛡️ SessionGuard - Respuesta:', res.status, res.statusText);
        
        if ((res.status === 401 || res.status === 403) && !expired) {
          console.log('🛡️ SessionGuard - Sesión expirada, limpiando token');
          expired = true;
          localStorage.removeItem('auth_token'); // Limpiar token inválido
          toast({
            title: "Sesión expirada",
            description: "Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          });
          router.push(`/?next=${encodeURIComponent(pathname)}`);
        }
      } catch (e) {
        console.log('🛡️ SessionGuard - Error:', e);
        // En caso de error, limpiar token y redirigir
        localStorage.removeItem('auth_token');
        if (!expired) {
          expired = true;
          router.push(`/?next=${encodeURIComponent(pathname)}`);
        }
      }
    };
    checkSession();
    intervalRef.current = setInterval(checkSession, 60000); // cada 1 minuto
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
} 



