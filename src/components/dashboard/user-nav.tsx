"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { logout } from "@/components/auth/login-form";
import { parseJwt } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useLotesSolicitados } from "@/hooks/use-lotes-solicitados";

export function UserNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading } = useUser();
  const { count: lotesSolicitadosCount } = useLotesSolicitados();
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout(router);
  };


  // Mostrar loading state mientras se cargan los datos del usuario
  if (loading) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled>
        <Avatar className="h-9 w-9">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {user?.foto_perfil && <AvatarImage src={user.foto_perfil} alt={user?.nombre || 'User avatar'} />}
            <AvatarFallback>
              {user?.nombre ? user.nombre.charAt(0).toUpperCase() : user?.mail ? user.mail.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          {mounted && lotesSolicitadosCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {lotesSolicitadosCount > 99 ? '99+' : lotesSolicitadosCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.nombre || "Agente"} {user?.apellido || "Apellido"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.mail || "agente@baigun.realty"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/lotes/mi-perfil">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Label
              htmlFor="dark-mode-toggle"
              className="flex w-full cursor-pointer items-center justify-between text-sm font-normal"
            >
              Modo Oscuro
              <Switch
                id="dark-mode-toggle"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="ml-2"
              />
            </Label>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
