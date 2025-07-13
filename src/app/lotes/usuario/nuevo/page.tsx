"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  user: z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserCreatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      mail: "",
      rol: "",
      user: "",
      password: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    fetch("/api/users/roles")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.roles)) setRoles(data.roles);
      });
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("nombre", data.nombre);
      formData.append("apellido", data.apellido);
      formData.append("mail", data.mail);
      formData.append("rol", data.rol);
      formData.append("user", data.user);
      formData.append("password", data.password);
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }
      const res = await fetch("/api/users", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Usuario creado exitosamente" });
        router.push("/lotes/profile");
      } else {
        toast({
          variant: "destructive",
          title: "Error al crear usuario",
          description: result.error || result.message || "",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error de red",
      });
    }
    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crear Usuario</h1>
        <p className="text-muted-foreground">Completa los datos para crear un nuevo usuario.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={previewUrl || ''} data-ai-hint="person" />
                  <AvatarFallback>{getInitials(
                    form.watch('nombre'),
                    form.watch('apellido')
                  )}</AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="picture">Foto de perfil</Label>
                  <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" />
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
                        <Input placeholder="Nombre" {...field} />
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
                        <Input placeholder="Apellido" {...field} />
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de usuario" {...field} />
                      </FormControl>
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
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Usuario"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 