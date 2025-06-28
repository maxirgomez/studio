
"use client"

import Link from "next/link";
import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Target, Briefcase, TrendingUp, CheckCircle, Pencil, Trash2, XCircle, Clock, DollarSign, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const users = [
  {
    role: "Architect",
    name: "Maria Bailo Newton",
    username: "mbailo",
    email: "maria.bailo@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman professional",
    initials: "MN",
    lots: {
      tomarAccion: 5,
      tasacion: 2,
      evolucionando: 8,
      disponible: 10,
      descartado: 1,
      noVende: 3,
      reservado: 0,
      vendido: 4,
    },
  },
  {
    role: "Asesor",
    name: "Roxana Rajich",
    username: "rrajich",
    email: "roxana.rajich@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman smiling",
    initials: "RR",
    lots: {
      tomarAccion: 12,
      tasacion: 8,
      evolucionando: 15,
      disponible: 5,
      descartado: 2,
      noVende: 1,
      reservado: 3,
      vendido: 7,
    },
  },
  {
    role: "Asesor",
    name: "Santiago Liscovsky",
    username: "sliscovsky",
    email: "santiago.liscovsky@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man professional",
    initials: "SL",
    lots: {
      tomarAccion: 3,
      tasacion: 5,
      evolucionando: 7,
      disponible: 12,
      descartado: 0,
      noVende: 4,
      reservado: 2,
      vendido: 9,
    },
  },
  {
    role: "Asesor",
    name: "Martín Beorlegui",
    username: "mbeorlegui",
    email: "martin.beorlegui@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man portrait",
    initials: "MB",
    lots: {
      tomarAccion: 8,
      tasacion: 4,
      evolucionando: 10,
      disponible: 8,
      descartado: 3,
      noVende: 2,
      reservado: 1,
      vendido: 6,
    },
  },
  {
    role: "Asesor",
    name: "Iair Baredes",
    username: "ibaredes",
    email: "iair.baredes@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man happy",
    initials: "IB",
    lots: {
      tomarAccion: 7,
      tasacion: 6,
      evolucionando: 9,
      disponible: 11,
      descartado: 1,
      noVende: 1,
      reservado: 4,
      vendido: 5,
    },
  },
  {
    role: "Asesor",
    name: "Ariel Naem",
    username: "anaem",
    email: "Ariel.naem@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man with glasses",
    initials: "AN",
    lots: {
      tomarAccion: 9,
      tasacion: 3,
      evolucionando: 12,
      disponible: 7,
      descartado: 4,
      noVende: 0,
      reservado: 2,
      vendido: 8,
    },
  },
  {
    role: "Administrador",
    name: "Matías Poczter",
    username: "mpoczter",
    email: "Matias.poczter@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person smiling",
    initials: "MP",
    lots: {
      tomarAccion: 2,
      tasacion: 1,
      evolucionando: 5,
      disponible: 15,
      descartado: 0,
      noVende: 0,
      reservado: 5,
      vendido: 20,
    },
  },
  {
    role: "Administrador",
    name: "Matias Chirom",
    username: "mchirom",
    email: "Matias.chirom@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man office",
    initials: "MC",
    lots: {
      tomarAccion: 4,
      tasacion: 3,
      evolucionando: 6,
      disponible: 18,
      descartado: 1,
      noVende: 2,
      reservado: 3,
      vendido: 15,
    },
  },
];

type UserType = (typeof users)[0];

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
  role: z.string({
    required_error: "Por favor, selecciona un rol.",
  }),
});

const createUserFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  username: z.string().min(3, {
    message: "El nombre de usuario debe tener al menos 3 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
  }),
  role: z.string({
    required_error: "Por favor, selecciona un rol.",
  }),
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;
type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

function EditUserForm({ user, onFormSubmit }: { user: UserType, onFormSubmit: () => void }) {
  const { toast } = useToast();
  const nameParts = user.name.split(" ");
  const lastName = nameParts.pop() || "";
  const firstName = nameParts.join(" ");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      role: user.role,
    },
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    toast({
      title: "Perfil Actualizado",
      description: `Los datos de ${data.firstName} ${data.lastName} han sido guardados.`,
    });
    onFormSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
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
            name="lastName"
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
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Architect">Architect</SelectItem>
                  <SelectItem value="Asesor">Asesor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit">Guardar Cambios</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function CreateUserForm({ onFormSubmit }: { onFormSubmit: () => void }) {
  const { toast } = useToast();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  function onSubmit(data: CreateUserFormValues) {
    // Logic to create user in Firebase Auth and Firestore would go here.
    toast({
      title: "Usuario Creado",
      description: `El usuario ${data.firstName} ${data.lastName} ha sido creado exitosamente.`,
    });
    onFormSubmit();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
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
            name="lastName"
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
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de Usuario</FormLabel>
              <FormControl>
                <Input placeholder="nombredeusuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Architect">Architect</SelectItem>
                  <SelectItem value="Asesor">Asesor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit">Crear Usuario</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}


const UserCard = ({ user }: { user: UserType }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return(
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatarUrl} data-ai-hint={user.aiHint} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.username} &middot; {user.email}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-2 text-muted-foreground">Lotes asignados:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Tomar Acción: {user.lots.tomarAccion}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Tasación: {user.lots.tasacion}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Evolucionando: {user.lots.evolucionando}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Disponible: {user.lots.disponible}</span>
          </div>
           <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            <span>Descartado: {user.lots.descartado}</span>
          </div>
           <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>No vende: {user.lots.noVende}</span>
          </div>
           <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Reservado: {user.lots.reservado}</span>
          </div>
           <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Vendido: {user.lots.vendido}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link href={`/lotes?agent=${encodeURIComponent(user.name)}`} className="w-full">
          <Button className="w-full">Ver Lotes</Button>
        </Link>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Editar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Realiza cambios en el perfil del usuario. Haz clic en guardar cuando termines.
              </DialogDescription>
            </DialogHeader>
            <EditUserForm user={user} onFormSubmit={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}


export default function UsersPage() {
   const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
   const groupedUsers = users.reduce((acc, user) => {
    (acc[user.role] = acc[user.role] || []).push(user);
    return acc;
  }, {} as Record<string, typeof users>);
  
  const roleOrder = ["Administrador", "Architect", "Asesor"];
  const sortedRoles = Object.keys(groupedUsers).sort((a, b) => {
    const indexA = roleOrder.indexOf(a);
    const indexB = roleOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios de tu organización.</p>
        </div>
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo usuario en el sistema.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onFormSubmit={() => setIsCreateUserDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Accordion type="multiple" defaultValue={sortedRoles} className="w-full space-y-4">
        {sortedRoles.map((role) => (
          <AccordionItem value={role} key={role} className="border-none">
            <AccordionTrigger className="p-0 hover:no-underline mb-4">
              <h2 className="text-2xl font-bold">{role}</h2>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupedUsers[role].map(user => <UserCard key={user.email} user={user} />)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

    