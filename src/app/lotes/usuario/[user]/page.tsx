"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import ProfileCardSkeleton from "@/components/lotes/ProfileCardSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";

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
  rol: z.string().min(1, { message: "El rol es obligatorio." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfileEditPage() {
  const { toast } = useToast();
  const params = useParams<{ user: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const { user: currentUser, loading: loadingUser } = useUser();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      mail: "",
      rol: "",
      password: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    setLoading(true);
    console.log("[DEBUG] params.user:", params.user);
    const url = `/api/users?user=${encodeURIComponent(params.user)}`;
    console.log("[DEBUG] Fetching:", url);
    fetch(url)
      .then(res => {
        console.log("[DEBUG] Response status:", res.status);
        return res.json().then(data => ({ status: res.status, data }));
      })
      .then(({ status, data }) => {
        console.log("[DEBUG] Response data:", data);
        if (status !== 200 || !data || (!data.user && !data.nombre && !data.apellido)) {
          setUser(null);
          setLoading(false);
          return;
        }
        const u = data.user || data;
        setUser(u);
        form.reset({
          nombre: u.nombre || "",
          apellido: u.apellido || "",
          mail: u.mail || u.email || "",
          rol: u.rol || u.role || roles[0] || "",
          password: "",
        });
        setPreviewUrl(u.foto_perfil || u.avatarUrl || null);
        setHasChanges(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[DEBUG] Fetch error:", err);
        setLoading(false);
      });
    // Obtener roles únicos
    fetch("/api/users/roles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.roles)) setRoles(data.roles);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.user]);

  useEffect(() => {
    if (!editMode) return;
    const subscription = form.watch((values) => {
      const changed =
        values.nombre !== (user?.nombre || "") ||
        values.apellido !== (user?.apellido || "") ||
        values.mail !== (user?.mail || user?.email || "") ||
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
    if (!hasChanges) return;
    if (!user) return;
    // PATCH al backend para actualizar nombre, apellido, mail, rol y contraseña
    const res = await fetch(`/api/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: params.user,
        nombre: data.nombre,
        apellido: data.apellido,
        mail: data.mail,
        rol: data.rol,
        password: data.password || undefined,
      }),
    });
    if (res.ok) {
      toast({ title: "Perfil actualizado" });
      // Refrescar datos del usuario
      const resUser = await fetch(`/api/users?user=${encodeURIComponent(params.user)}`);
      if (resUser.ok) {
        const { user: updatedUser } = await resUser.json();
        form.reset({
          nombre: updatedUser.nombre || "",
          apellido: updatedUser.apellido || "",
          mail: updatedUser.mail || updatedUser.email || "",
          password: "",
        });
        setPreviewUrl(updatedUser.foto_perfil || updatedUser.avatarUrl || null);
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
      formData.append("user", params.user);
      const resImg = await fetch(`/api/users/avatar`, {
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

  // Solo puede editar si es admin o si es Max
  const canEdit = currentUser && (currentUser.rol === "Administrador" || currentUser.mail === "maxi.r.gomez@gmail.com");
  // Solo puede editar el rol si es admin o Max y no es su propio perfil
  const canEditRol = currentUser && (currentUser.rol === "Administrador" || currentUser.mail === "maxi.r.gomez@gmail.com") && currentUser.user !== params.user;

  if (loading || !minTimePassed) {
    return <ProfileCardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Perfil de Usuario</h1>
        <p className="text-muted-foreground">Administra la información personal y de la cuenta de este usuario.</p>
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
                  <AvatarImage src={previewUrl || ''} data-ai-hint="person" />
                  <AvatarFallback>{getInitials(
                    form.watch('nombre') || user?.nombre,
                    form.watch('apellido') || user?.apellido
                  )}</AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="picture">Foto de perfil</Label>
                  <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" disabled={!editMode} />
                  {!user?.foto_perfil && !user?.avatarUrl && (
                    <span className="text-xs text-red-500 mt-1">No tiene imagen de perfil. Sube una para personalizar la cuenta.</span>
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
                        <Input placeholder="Nombre" {...field} disabled={!editMode} />
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
                        <Input placeholder="Apellido" {...field} disabled={!editMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select disabled={!canEditRol || !editMode} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((rol) => (
                            <SelectItem key={rol} value={rol}>{rol}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                <Button type="button" onClick={() => canEdit && setEditMode(true)} disabled={!canEdit}>
                  Editar Perfil
                </Button>
              ) : (
                <Button type="submit" disabled={!hasChanges || !canEdit}>
                  Actualizar Perfil
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 