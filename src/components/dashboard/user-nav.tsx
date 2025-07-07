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

export function UserNav() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading } = useUser();

  const handleLogout = async () => {
    await logout(router);
  };

  const getInitials = (nombre?: string, mail?: string): string => {
    if (nombre) {
      const parts = nombre.split(' ').filter(Boolean);
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      if(parts.length === 1 && parts[0].length > 0) {
        return parts[0].substring(0,2).toUpperCase();
      }
    }
    if (mail) {
      return mail.substring(0,2).toUpperCase();
    }
    return "AU";
  };

  return (
    <DropdownMenu>
      {/* Log para ver el user en el render */}
      {/* {user && console.log('[UserNav] Render user:', user)} */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            {user?.foto_perfil && <AvatarImage src={user.foto_perfil} alt={user?.nombre || 'User avatar'} />}
            <AvatarFallback>{getInitials(user?.nombre, user?.mail)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.nombre || "Agente"} {user?.apellido || "Apellido"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.mail || "agente@baigun.realty"}</p>
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
