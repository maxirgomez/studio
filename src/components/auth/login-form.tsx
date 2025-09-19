"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  sendPasswordResetEmail,
  onAuthStateChanged,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";

const formSchema = z.object({
  usuarioOEmail: z.string().min(1, { message: "El usuario o email es requerido." }).refine(
    (val) => {
      if (val.includes("@")) {
        // Validar formato de email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      return true;
    },
    { message: "El email no es válido." }
  ),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");
  const { toast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<'email' | 'password'>('email');
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshUser } = useUser();
  const [postLoginLoading, setPostLoginLoading] = useState(false);

  useEffect(() => {
    if (lockUntil) {
      function updateRemaining() {
        if (!lockUntil) return;
        const now = new Date();
        const diff = lockUntil.getTime() - now.getTime();
        if (diff <= 0) {
          setLockUntil(null);
          setRemaining("");
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          const min = Math.floor(diff / 60000);
          const sec = Math.floor((diff % 60000) / 1000);
          setRemaining(`${min}:${sec.toString().padStart(2, "0")}`);
        }
      }
      updateRemaining();
      intervalRef.current = setInterval(updateRemaining, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [lockUntil]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuarioOEmail: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioOEmail: values.usuarioOEmail, password: values.password }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error && data.error.includes("Demasiados intentos")) {
        // Extraer fecha/hora del mensaje
        const match = data.error.match(/despu[eé]s de (.+)$/i);
        if (match) {
          const until = new Date(match[1]);
          setLockUntil(until);
        }
        toast({
          title: "Demasiados intentos",
          description: data.error,
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        toast({
          title: "Error de inicio de sesión",
          description: data.error || "Usuario o contraseña incorrectos.",
          variant: "destructive",
        });
        return;
      }
      
      // Almacenar el token en localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        console.log('🔑 Login - Token guardado en localStorage');
      }
      
      toast({
        title: "Login exitoso",
        description: `¡Bienvenido de nuevo, ${data.user.user || data.user.email}!`,
      });
      setPostLoginLoading(true);
      
      // Esperar un poco para asegurar que el token se guarde
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('🔄 Login - Llamando a refreshUser después del login');
      await refreshUser();
      // Si next es '/' o vacío, redirige a /lotes
      if (!nextUrl || nextUrl === "/") {
        router.push("/lotes");
      } else {
        router.push(nextUrl);
      }
    } catch (error) {
      toast({
        title: "Error de inicio de sesión",
        description: "Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  }
  
  async function handlePasswordReset() {
    if (!resetEmail) {
       toast({
        title: "Error",
        description: "Por favor, introduce tu email.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch("/api/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      if (res.ok) {
        toast({
          title: "Email de recuperación enviado",
          description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        });
        setResetStep('password');
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "No se pudo enviar el email de recuperación.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
       toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación. Verifica que el correo sea correcto.",
        variant: "destructive",
      });
    }
  }

  async function handlePasswordChange() {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: resetToken, 
          newPassword: newPassword 
        }),
      });
      
      if (res.ok) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido restablecida exitosamente.",
        });
        setIsResetDialogOpen(false);
        setResetStep('email');
        setResetEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setResetToken("");
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "No se pudo restablecer la contraseña.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  function handleResetDialogClose() {
    setIsResetDialogOpen(false);
    setResetStep('email');
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
  }

  if (postLoginLoading) {
    return <div className="flex justify-center items-center h-64 text-lg font-semibold">Cargando tu información...</div>;
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Introduce tu usuario o email y contraseña para acceder
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {lockUntil ? (
            <div className="text-center text-red-600 font-semibold">
              Demasiados intentos fallidos.<br />
              Intenta nuevamente en <span>{remaining}</span> minutos.
            </div>
          ) : null}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="usuarioOEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Usuario o Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="usuario o email"
                        {...field}
                        disabled={!!lockUntil}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel className="font-bold">Contraseña</FormLabel>
                        <Button 
                          variant="link" 
                          type="button" 
                          className="ml-auto inline-block px-0 text-sm"
                          onClick={() => setIsResetDialogOpen(true)}
                        >
                          ¿Olvidaste tu contraseña?
                        </Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={!!lockUntil} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={!!lockUntil}>
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
        </CardFooter>
      </Card>
      
      <Dialog open={isResetDialogOpen} onOpenChange={handleResetDialogClose}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {resetStep === 'email' ? 'Restablecer Contraseña' : 'Nueva Contraseña'}
          </DialogTitle>
          <DialogDescription>
            {resetStep === 'email' 
              ? 'Introduce tu dirección de email y te enviaremos un enlace para restablecer tu contraseña.'
              : 'Introduce tu nueva contraseña y el token que recibiste por email.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {resetStep === 'email' ? (
            <div className="grid items-center gap-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="email@ejemplo.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="reset-token">Token de verificación</Label>
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Pega aquí el token del email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancelar</Button>
          </DialogClose>
          {resetStep === 'email' ? (
            <Button type="button" onClick={handlePasswordReset}>
              Enviar enlace
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => setResetStep('email')}>
                Volver
              </Button>
              <Button type="button" onClick={handlePasswordChange}>
                Cambiar contraseña
              </Button>
            </>
          )}
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export async function logout(router: any) {
  await fetch("/api/logout", { method: "POST" });
  router.push("/");
}
