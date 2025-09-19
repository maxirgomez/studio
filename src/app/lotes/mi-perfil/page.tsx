"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useUser } from "@/context/UserContext"
import { useNotification } from "@/context/NotificationContext"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ProfileCardSkeleton from "@/components/lotes/ProfileCardSkeleton"
import { Badge } from "@/components/ui/badge"
import { MapPin, Ruler, DollarSign, User, Check, X } from "lucide-react"

const profileFormSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  apellido: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  mail: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
  }),
  user: z.string().min(2, {
    message: "El nombre de usuario debe tener al menos 2 caracteres.",
  }),
  password: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function MyProfilePage() {
  const { toast } = useToast();
  const { user, loading, refreshUser } = useUser();
  const { refreshLotesSolicitados } = useNotification();
  
  // Debug logs
  console.log('🎯 ProfilePage - Estado actual:');
  console.log('  - loading:', loading);
  console.log('  - user:', user);
  console.log('  - user?.nombre:', user?.nombre);
  console.log('  - user?.apellido:', user?.apellido);
  console.log('  - user?.mail:', user?.mail);
  console.log('  - user?.user:', user?.user);
  console.log('  - user?.rol:', user?.rol);
  console.log('  - user?.foto_perfil:', user?.foto_perfil);
  console.log('  - localStorage token:', typeof window !== 'undefined' ? localStorage.getItem('auth_token') : 'N/A');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  
  // Estados para lotes solicitados
  const [lotesSolicitados, setLotesSolicitados] = useState<any[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [transferiendo, setTransferiendo] = useState<string | null>(null);
  
  // Estado para debug del token
  const [tokenStatus, setTokenStatus] = useState<string>('verificando...');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      mail: "",
      user: "",
      password: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    console.log('🔄 ProfilePage - useEffect ejecutado, user:', user);
    if (user) {
      console.log('🔄 ProfilePage - Actualizando formulario con datos:', {
        nombre: user.nombre,
        apellido: user.apellido,
        mail: user.mail,
        user: user.user
      });
      // Forzar la actualización del formulario con los datos del usuario
      form.reset({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        mail: user.mail || "",
        user: user.user || "",
        password: "",
      });
      setPreviewUrl(user.foto_perfil || null);
      setHasChanges(false);
    }
  }, [user, form]);

  useEffect(() => {
    if (!editMode) return;
    const subscription = form.watch((values) => {
      const changed =
        values.nombre !== (user?.nombre || "") ||
        values.apellido !== (user?.apellido || "") ||
        values.user !== (user?.user || "") ||
        values.mail !== (user?.mail || "") ||
        values.password !== "" ||
        !!selectedFile;
      setHasChanges(changed);
    });
    return () => subscription.unsubscribe();
  }, [editMode, form, user, selectedFile]);

  useEffect(() => {
    setMinTimePassed(false);
    const timer = setTimeout(() => setMinTimePassed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar lotes solicitados
  useEffect(() => {
    if (user) {
      fetchLotesSolicitados();
    }
  }, [user]);

  const fetchLotesSolicitados = async () => {
    if (!user) return;
    
    setLoadingSolicitudes(true);
    try {
      const res = await fetch(`/api/lotes/solicitudes-pendientes?agente=${user.user}`);
      if (res.ok) {
        const data = await res.json();
        setLotesSolicitados(data.solicitudes || []);
      } else {
        setLotesSolicitados([]);
      }
    } catch (error) {
      console.error('Error al obtener lotes solicitados:', error);
      setLotesSolicitados([]);
    }
    setLoadingSolicitudes(false);
  };

  const transferirLote = async (smp: string, usuarioSolicitante: string) => {
    if (!user) return;
    
    setTransferiendo(smp);
    try {
      const res = await fetch(`/api/lotes/${smp}/solicitar/${user.user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'aceptar',
          agenteActual: user.user,
          nuevoAgente: usuarioSolicitante,
          motivo: 'Transferencia aceptada desde mi perfil'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Lote Transferido",
          description: `El lote ha sido transferido a ${usuarioSolicitante} exitosamente.`,
        });
        
        // Remover el lote de la lista
        setLotesSolicitados(prev => prev.filter(lote => lote.smp !== smp));
        
        // Refrescar el contador de notificaciones
        refreshLotesSolicitados();
      } else {
        throw new Error(data.error || 'Error al transferir lote');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo transferir el lote.",
      });
    }
    setTransferiendo(null);
  };

  const rechazarSolicitud = async (smp: string, usuarioSolicitante: string) => {
    if (!user) return;
    
    setTransferiendo(smp);
    try {
      const res = await fetch(`/api/lotes/${smp}/solicitar/${user.user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'rechazar',
          agenteActual: user.user,
          nuevoAgente: null,
          motivo: 'Solicitud rechazada desde mi perfil'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Solicitud Rechazada",
          description: `La solicitud de ${usuarioSolicitante} ha sido rechazada.`,
        });
        
        // Remover el lote de la lista
        setLotesSolicitados(prev => prev.filter(lote => lote.smp !== smp));
        
        // Refrescar el contador de notificaciones
        refreshLotesSolicitados();
      } else {
        throw new Error(data.error || 'Error al rechazar solicitud');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo rechazar la solicitud.",
      });
    }
    setTransferiendo(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!hasChanges) return;
    if (!user) return;
    // PATCH al backend para actualizar nombre, apellido, user, mail y contraseña
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    console.log('📝 MiPerfil - PATCH /api/me con token:', token ? 'SÍ' : 'NO');
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        nombre: data.nombre,
        apellido: data.apellido,
        user: data.user,
        mail: data.mail,
        password: data.password || undefined,
      }),
    });
    if (res.ok) {
      toast({ title: "Perfil actualizado" });
      await refreshUser();
      // Refrescar datos del usuario
      console.log('📝 MiPerfil - GET /api/me para refrescar usuario, token:', token ? 'SÍ' : 'NO');
      const resUser = await fetch("/api/me", {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      if (resUser.ok) {
        const { user: updatedUser } = await resUser.json();
        form.reset({
          nombre: updatedUser.nombre || "",
          apellido: updatedUser.apellido || "",
          user: updatedUser.user || "",
          mail: updatedUser.mail || "",
          password: "",
        });
        setPreviewUrl(updatedUser.foto_perfil || null);
      }
    } else {
      const err = await res.json();
      toast({
        variant: "destructive",
        title: "Error al actualizar el perfil",
        description: err.error || err.message || "",
      });
      return;
    }
    // Subir imagen de perfil si hay archivo seleccionado
    if (selectedFile) {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      console.log('🖼️ MiPerfil - POST /api/me/avatar con token:', token ? 'SÍ' : 'NO');
      const resImg = await fetch("/api/me/avatar", {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: formData,
      });
      if (resImg.ok) {
        const { avatarUrl } = await resImg.json();
        setPreviewUrl(avatarUrl);
        toast({ title: "Imagen de perfil actualizada" });
      } else {
        toast({
          variant: "destructive",
          title: "Error al subir la imagen de perfil",
        });
      }
    }
    setEditMode(false);
    setHasChanges(false);
  }

  const getInitials = (nombre?: string, apellido?: string): string => {
    if (nombre && apellido) {
      return `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase();
    }
    if (nombre) {
      return nombre.substring(0,2).toUpperCase();
    }
    return "AU";
  };

  if (loading || !minTimePassed) {
    return <ProfileCardSkeleton />;
  }

  // Si no hay usuario después de cargar, mostrar mensaje de no autenticado
  if (!loading && !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información perasdasdasdassonal y de la cuenta.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">🔒</div>
              <h2 className="text-2xl font-semibold">No estás autenticado</h2>
              <p className="text-muted-foreground">
                Necesitas iniciar sesión para ver tu perfil.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Iniciar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información personal y de la cuenta.</p>
        </div>
      </div>



      <Card>
        <CardHeader>
          <CardTitle>Editar Información</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modifica tu información personal y cambia tu contraseña.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={previewUrl || ''} alt="Vista previa de foto de perfil" data-ai-hint="person" />
                  <AvatarFallback>{getInitials(
                    form.watch('nombre') || user?.nombre,
                    form.watch('apellido') || user?.apellido
                  )}</AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="picture">Foto de perfil</Label>
                  <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" disabled={!editMode} />
                  {!user?.foto_perfil && (
                    <span className="text-xs text-red-500 mt-1">No tienes imagen de perfil. Sube una para personalizar tu cuenta.</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={editMode ? "Tu nombre" : ""}
                          {...field} 
                          disabled={!editMode}
                          value={editMode ? (field.value ?? "") : (user?.nombre || "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={editMode ? "Tu apellido" : ""}
                          {...field} 
                          disabled={!editMode}
                          value={editMode ? (field.value ?? "") : (user?.apellido || "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                             <FormField
                 control={form.control}
                 name="user"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Nombre de Usuario</FormLabel>
                     <FormControl>
                       <Input 
                         placeholder="tu_usuario" 
                         {...field} 
                         disabled={!editMode}
                         value={field.value || user?.user || ''}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />

              <FormField
                control={form.control}
                name="mail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@ejemplo.com" 
                        {...field} 
                        disabled={!editMode}
                        value={field.value || user?.mail || ""}
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
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={!editMode} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!editMode ? (
                <Button type="button" onClick={() => setEditMode(true)}>
                  Editar Perfil
                </Button>
              ) : (
                <Button type="submit" disabled={!hasChanges}>
                  Actualizar Perfil
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Sección de Lotes Solicitados */}
      {minTimePassed && lotesSolicitados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Lotes Solicitados ({lotesSolicitados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lotesSolicitados.map((lote) => (
                <div key={lote.smp} className="border rounded-lg p-4 bg-muted/50 border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          {lote.usuarioInfo?.foto_perfil ? (
                            <AvatarImage 
                              src={lote.usuarioInfo.foto_perfil} 
                              alt={`Foto de ${lote.usuarioInfo.nombre} ${lote.usuarioInfo.apellido}`} 
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {lote.usuarioInfo?.iniciales || lote.usuarioSolicitante[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {lote.usuarioInfo 
                              ? `${lote.usuarioInfo.nombre} ${lote.usuarioInfo.apellido}`.trim()
                              : lote.usuarioSolicitante
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            solicita este lote
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-11">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{lote.direccion}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{lote.barrio}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            <span>{lote.m2aprox} m²</span>
                          </div>
                          {lote.vventa && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${lote.vventa.toLocaleString('es-AR')}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            SMP: {lote.smp}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => transferirLote(lote.smp, lote.usuarioSolicitante)}
                        disabled={transferiendo === lote.smp}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Transferir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => rechazarSolicitud(lote.smp, lote.usuarioSolicitante)}
                        disabled={transferiendo === lote.smp}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
