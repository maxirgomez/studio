
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

const profileFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function MyProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isReauthDialogOpen, setIsReauthDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const name = currentUser.displayName || "";
        const nameParts = name.split(" ");
        const lastName = nameParts.pop() || "";
        const firstName = nameParts.join(" ");

        form.reset({
          firstName: firstName,
          lastName: lastName,
          email: currentUser.email || "",
        });
        setPreviewUrl(currentUser.photoURL);
      }
    });

    return () => unsubscribe();
  }, [form]);

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

  const handleReauthenticateAndSubmit = async (data: ProfileFormValues) => {
    if (!user || !user.email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Se requiere la contraseña para actualizar el email.",
      });
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await onSubmit(data, true); // Retry submit after reauthentication
      setIsReauthDialogOpen(false);
      setPassword("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: "La contraseña es incorrecta. Por favor, inténtalo de nuevo.",
      });
    }
  };


  async function onSubmit(data: ProfileFormValues, reauthenticated = false) {
    if (!user) return;

    const newDisplayName = `${data.firstName} ${data.lastName}`.trim();

    // Update Display Name
    if (newDisplayName !== user.displayName) {
      try {
        await updateProfile(user, {
          displayName: newDisplayName,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error al actualizar el nombre",
          description: error.message,
        });
        return;
      }
    }
    
    // Update Email
    if (data.email !== user.email) {
      setPendingEmail(data.email);
      try {
        await updateEmail(user, data.email);
        toast({
          title: "Email actualizado",
          description: "Tu dirección de email ha sido actualizada.",
        });
        setPendingEmail(null);
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login' && !reauthenticated) {
            setIsReauthDialogOpen(true);
            return;
        }
        toast({
            variant: "destructive",
            title: "Error al actualizar el email",
            description: error.message,
        });
        setPendingEmail(null);
        return;
      }
    }

    // TODO: Update Photo URL after implementing file storage
    // if (selectedFile) { ... }

    if (newDisplayName === user.displayName && data.email === user.email && !selectedFile) {
       toast({
        title: "Sin cambios",
        description: "No se han detectado cambios en tu perfil.",
      });
      return;
    }
    
    toast({
      title: "Perfil Actualizado",
      description: "Tus datos han sido guardados.",
    });
  }
  
  const { firstName, lastName } = form.watch();
  const currentDisplayName = `${firstName || ""} ${lastName || ""}`.trim();
  
  const getInitials = (name?: string | null): string => {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      if(parts.length === 1 && parts[0].length > 0) {
        return parts[0].substring(0,2).toUpperCase();
      }
    }
    return user?.email?.substring(0,2).toUpperCase() || "AU";
  };


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
                  <AvatarImage src={previewUrl || user?.photoURL || ''} data-ai-hint="person" />
                  <AvatarFallback>{getInitials(currentDisplayName)}</AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="picture">Foto de perfil</Label>
                  <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
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
              <Button type="submit">Actualizar Perfil</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <AlertDialog open={isReauthDialogOpen} onOpenChange={setIsReauthDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se requiere reautenticación</AlertDialogTitle>
            <AlertDialogDescription>
              Por seguridad, por favor ingresa tu contraseña nuevamente para cambiar tu dirección de email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleReauthenticateAndSubmit(form.getValues())}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
