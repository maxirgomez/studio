"use client"

import React, { useState, useEffect } from "react";
import UserList from "@/components/users/UserList";
import UserDialog from "@/components/users/UserDialog";
import { users } from "@/lib/data";
import { useUser } from "@/context/UserContext";

// Agrupar usuarios por rol
const usersByRole = users.reduce((acc, user) => {
  (acc[user.role] = acc[user.role] || []).push(user);
  return acc;
}, {} as Record<string, typeof users>);

const estadoColors: Record<string, string> = {
  Disponible: "bg-green-200 text-green-800",
  Vendido: "bg-blue-200 text-blue-800",
  "Tomar Acción": "bg-yellow-200 text-yellow-800",
  Tasación: "bg-purple-200 text-purple-800",
  Evolucionando: "bg-orange-200 text-orange-800",
  Descartado: "bg-gray-200 text-gray-800",
  "No vende": "bg-red-200 text-red-800",
  Reservado: "bg-pink-200 text-pink-800",
  // Agrega más si es necesario
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
        {currentUser?.rol === "Architect" && (
          <a
            href="/lotes/usuario/nuevo"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            + Crear usuario
          </a>
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
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg">
                      {user.nombre?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{nombreCompleto}</div>
                      <div className="text-sm text-muted-foreground">{email}</div>
                      <div className="text-xs">Rol: {user.rol || user.role || "Rol"}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4 mt-2">
                    {(user.estadosDisponibles || []).map((estado: string) => {
                      const found = user.estados?.find((e: any) => e.estado === estado);
                      const count = found ? found.cantidad : 0;
                      return (
                        <span
                          key={estado}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColors[estado] || "bg-gray-100 text-gray-700"}`}
                        >
                          {estado}: {count}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <a
                      href={`/lotes?agent=${encodeURIComponent(user.user)}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                    >
                      Ver lotes
                    </a>
                    <a
                      href={`/lotes/usuario/${encodeURIComponent(user.user)}`}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-semibold transition-colors"
                    >
                      Editar
                    </a>
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
