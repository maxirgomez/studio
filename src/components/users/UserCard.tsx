import React from "react";

export default function UserCard({ user, onEdit }: { user: any; onEdit?: () => void }) {
  const nombreCompleto = (user?.nombre && user?.apellido)
    ? `${user.nombre} ${user.apellido}`
    : user?.name || "Nombre Usuario";
  const email = user?.mail || user?.email || "email@ejemplo.com";
  const rol = user?.rol || user?.role || "Rol";

  return (
    <div className="border rounded p-4">
      {/* Avatar, nombre, email, rol, botones */}
      <div className="font-bold">{nombreCompleto}</div>
      <div className="text-sm text-muted-foreground">{email}</div>
      <div className="text-xs mt-2">Rol: {rol}</div>
      <button onClick={onEdit} className="mt-2 text-blue-600 underline">Editar</button>
    </div>
  );
} 