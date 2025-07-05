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
    // No chequear sesión en /login ni rutas públicas
    if (pathname.startsWith("/login")) return;
    let expired = false;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/me");
        const now = new Date();
        console.log('[SessionGuard] checkSession at', now.toLocaleTimeString(), 'status:', res.status);
        if ((res.status === 401 || res.status === 403) && !expired) {
          expired = true;
          toast({
            title: "Sesión expirada",
            description: "Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          });
          router.push(`/?next=${encodeURIComponent(pathname)}`);
        }
      } catch (e) {
        console.log('[SessionGuard] Error en checkSession:', e);
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