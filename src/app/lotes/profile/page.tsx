
import Link from "next/link";
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
    role: "Architect",
    name: "Maria Bailo Newton",
    username: "@mariabailo",
    email: "maria.bailo@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman professional",
    initials: "MN",
    lots: {
      accion: 5,
      tasacion: 2,
      evolucionando: 8,
      disponible: 10,
    },
  },
  {
    role: "Asesor",
    name: "Roxana Rajich",
    username: "@roxanarajich",
    email: "roxana.rajich@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman smiling",
    initials: "RR",
    lots: {
      accion: 12,
      tasacion: 8,
      evolucionando: 15,
      disponible: 5,
    },
  },
  {
    role: "Asesor",
    name: "Santiago Liscovsky",
    username: "@santiagoliscovsky",
    email: "santiago.liscovsky@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man professional",
    initials: "SL",
    lots: {
      accion: 3,
      tasacion: 5,
      evolucionando: 7,
      disponible: 12,
    },
  },
  {
    role: "Asesor",
    name: "Martín Beorlegui",
    username: "@martinbeorlegui",
    email: "martin.beorlegui@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man portrait",
    initials: "MB",
    lots: {
      accion: 8,
      tasacion: 4,
      evolucionando: 10,
      disponible: 8,
    },
  },
  {
    role: "Asesor",
    name: "Iair Baredes",
    username: "@iairbaredes",
    email: "iair.baredes@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man happy",
    initials: "IB",
    lots: {
      accion: 7,
      tasacion: 6,
      evolucionando: 9,
      disponible: 11,
    },
  },
  {
    role: "Asesor",
    name: "Ariel Naem",
    username: "@arielnaem",
    email: "Ariel.naem@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man with glasses",
    initials: "AN",
    lots: {
      accion: 9,
      tasacion: 3,
      evolucionando: 12,
      disponible: 7,
    },
  },
  {
    role: "Administrador",
    name: "Matías Poczter",
    username: "@matiaspoczter",
    email: "Matias.poczter@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person smiling",
    initials: "MP",
    lots: {
      accion: 2,
      tasacion: 1,
      evolucionando: 5,
      disponible: 15,
    },
  },
  {
    role: "Administrador",
    name: "Matias Chirom",
    username: "@matiaschirom",
    email: "Matias.chirom@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man office",
    initials: "MC",
    lots: {
      accion: 4,
      tasacion: 3,
      evolucionando: 6,
      disponible: 18,
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
      <Link href={`/lotes?agent=${encodeURIComponent(user.name)}`} className="w-full">
        <Button className="w-full">Ver Lotes</Button>
      </Link>
    </CardFooter>
  </Card>
);


export default function UsersPage() {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Administra los usuarios de tu organización.</p>
      </div>

      {sortedRoles.map((role) => (
        <div key={role}>
          <h2 className="text-2xl font-bold mb-4">{role}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupedUsers[role].map(user => <UserCard key={user.email} user={user} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
