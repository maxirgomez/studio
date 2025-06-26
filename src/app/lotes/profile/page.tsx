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
import { Target, Briefcase, TrendingUp, CheckCircle } from "lucide-react"

const users = [
  {
    role: "Admin",
    name: "Admin User",
    username: "@adminuser",
    email: "admin@baigun.realty",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man smiling",
    initials: "AU",
    lots: {
      accion: 5,
      tasacion: 2,
      evolucionando: 8,
      disponible: 10,
    },
  },
  {
    role: "Agente",
    name: "John Doe",
    username: "@johndoe",
    email: "john.doe@baigun.realty",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person portrait",
    initials: "JD",
    lots: {
      accion: 12,
      tasacion: 8,
      evolucionando: 15,
      disponible: 5,
    },
  },
  {
    role: "Agente",
    name: "Alice Smith",
    username: "@alicesmith",
    email: "alice.smith@baigun.realty",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman smiling",
    initials: "AS",
    lots: {
      accion: 3,
      tasacion: 5,
      evolucionando: 7,
      disponible: 12,
    },
  },
   {
    role: "Agente",
    name: "Ricardo Gonzalez",
    username: "@ricardog",
    email: "ricardo.gonzalez@baigun.realty",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man with glasses",
    initials: "RG",
    lots: {
      accion: 8,
      tasacion: 4,
      evolucionando: 10,
      disponible: 8,
    },
  },
];

const UserCard = ({ user }: { user: (typeof users)[0] }) => (
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
          <span>Tomar Acción: {user.lots.accion}</span>
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
      </div>
    </CardContent>
    <CardFooter>
      <Button className="w-full">Ver Lotes</Button>
    </CardFooter>
  </Card>
);


export default function UsersPage() {
   const groupedUsers = users.reduce((acc, user) => {
    (acc[user.role] = acc[user.role] || []).push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Administra los usuarios de tu organización.</p>
      </div>

      {Object.entries(groupedUsers).map(([role, usersInRole]) => (
        <div key={role}>
          <h2 className="text-2xl font-bold mb-4">{role}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {usersInRole.map(user => <UserCard key={user.email} user={user} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
