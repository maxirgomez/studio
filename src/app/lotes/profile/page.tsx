"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import UserList from "@/components/users/UserList";
import UserDialog from "@/components/users/UserDialog";
import { users } from "@/lib/data";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { getStatusStyles } from "@/lib/status-colors";

// Agrupar usuarios por rol
const usersByRole = users.reduce((acc, user) => {
  (acc[user.role] = acc[user.role] || []).push(user);
  return acc;
}, {} as Record<string, typeof users>);

const estadoColors: Record<string, any> = {
  "Tomar acción": getStatusStyles("Tomar acción"),
  "Tasación": getStatusStyles("Tasación"),
  "Evolucionando": getStatusStyles("Evolucionando"),
  "Disponible": getStatusStyles("Disponible"),
  "Descartado": getStatusStyles("Descartado"),
  "No vende": getStatusStyles("No vende"),
  "Reservado": getStatusStyles("Reservado"),
  "Vendido": getStatusStyles("Vendido"),
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersByRole, setUsersByRole] = useState<Record<string, any[]>>({});
  const { user: currentUser } = useUser();
  console.log("[DEBUG] currentUser:", currentUser);

  useEffect(() => {
    setLoading(true);
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        // Agrupar usuarios por rol
        const grouped: Record<string, any[]> = {};
        (data.users || data).forEach((user: any) => {
          const role = user.rol || user.role || "Sin rol";
          if (!grouped[role]) grouped[role] = [];
          grouped[role].push(user);
        });
        setUsersByRole(grouped);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Error al cargar usuarios");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8">Cargando usuarios...</div>;
  if (error) return <div className="text-center text-red-600 py-8">{error}</div>;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 bg-background">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        {(currentUser?.rol === "Architect" || currentUser?.rol === "Administrador") && (
          <Link href="/lotes/usuario/nuevo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Usuario
            </Button>
          </Link>
        )}
      </div>
      {Object.entries(usersByRole).map(([role, users]) => (
        <div key={role} className="mb-10">
          <h2 className="text-xl font-bold mb-4">{role}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map(user => {
              const nombreCompleto = (user?.nombre && user?.apellido)
                ? `${user.nombre} ${user.apellido}`
                : user?.name || "Nombre Usuario";
              const email = user?.mail || user?.email || "email@ejemplo.com";
              return (
                <div key={user.mail || user.email} className="border rounded-lg p-6 bg-white flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">
                      {user.nombre?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{nombreCompleto}</div>
                      <div className="text-sm text-muted-foreground">{email}</div>
                      <div className="text-xs">Rol: {user.rol || user.role || "Rol"}</div>
                    </div>
                  </div>
                  
                  {/* Chips de estados con contadores */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {(user.estados || [])
                        .filter((e: any) => e.cantidad > 0)
                        .sort((a: any, b: any) => b.cantidad - a.cantidad)
                                                 .map((estadoData: any) => (
                           <span
                             key={estadoData.estado}
                             className="px-3 py-1 rounded-full text-xs font-semibold"
                             style={estadoColors[estadoData.estado] || { backgroundColor: "#f3f4f6", color: "#374151" }}
                           >
                             {estadoData.estado}: {estadoData.cantidad}
                           </span>
                         ))}
                      {(!user.estados || user.estados.length === 0 || user.estados.every((e: any) => e.cantidad === 0)) && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Sin lotes asignados
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/lotes?agent=${encodeURIComponent(user.user)}`}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Ver Lotes
                      </Button>
                    </Link>
                    {/* Mostrar botón Editar si el usuario logueado es 'Max', Administrador, o tiene el mismo user */}
                    {(currentUser?.user === user.user || 
                      currentUser?.user === 'Max' || 
                      currentUser?.mail === 'maxi.r.gomez@gmail.com' ||
                      currentUser?.rol === 'Administrador') && (
                      <Link href={`/lotes/usuario/${encodeURIComponent(user.user)}`}>
                        <Button variant="secondary" className="flex items-center gap-2">
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
