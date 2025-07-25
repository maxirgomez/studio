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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

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
    if (user) {
      console.log('DEBUG: Cargando datos del usuario:', {
        nombre: user.nombre,
        apellido: user.apellido,
        mail: user.mail,
        user: user.user,
        foto_perfil: user.foto_perfil
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    console.log('DEBUG: Enviando datos del formulario:', data);
    if (!hasChanges) return;
    if (!user) return;
    // PATCH al backend para actualizar nombre, apellido, user, mail y contraseña
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
      const resUser = await fetch("/api/me");
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
      const resImg = await fetch("/api/me/avatar", {
        method: "POST",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal y de la cuenta.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
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
                        <Input placeholder="Tu nombre" {...field} disabled={!editMode} />
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
                        <Input placeholder="Tu apellido" {...field} disabled={!editMode} />
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
                         value={field.value || ''}
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
                      <Input type="email" placeholder="email@ejemplo.com" {...field} disabled={!editMode} />
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
    </div>
  )
}
