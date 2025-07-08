"use client"

import React, { useState } from "react";
import UserList from "@/components/users/UserList";
import UserDialog from "@/components/users/UserDialog";
import { users } from "@/lib/data";

// Agrupar usuarios por rol
const usersByRole = users.reduce((acc, user) => {
  (acc[user.role] = acc[user.role] || []).push(user);
  return acc;
}, {} as Record<string, typeof users>);

export default function ProfilePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEdit = async (user: any) => {
    setDialogMode("edit");
    setLoading(true);
    try {
      const res = await fetch(`/api/users?user=${encodeURIComponent(user.user || user.username)}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setSelectedUser(data.user);
      } else {
        setSelectedUser(user); // fallback
      }
    } catch (err) {
      setSelectedUser(user); // fallback
    }
    setLoading(false);
    setDialogOpen(true);
  };

  const handleSubmit = (values: any) => {
    setLoading(true);
    // Aquí irá la lógica real de crear/editar usuario
    setTimeout(() => {
      setLoading(false);
      setDialogOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios de tu organización.</p>
        </div>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded">Crear Usuario</button>
      </div>
      <UserList onEditUser={handleEdit} />
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={selectedUser}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}
