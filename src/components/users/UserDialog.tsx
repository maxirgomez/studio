import React from "react";
import UserForm from "./UserForm";
import UserFormSkeleton from "../users/UserFormSkeleton";

function mapUserToForm(user: any) {
  if (!user) return undefined;
  return {
    firstName: user.nombre || user.firstName || "",
    lastName: user.apellido || user.lastName || "",
    email: user.mail || user.email || "",
    role: user.rol || user.role || "",
    username: user.user || user.username || "",
    avatar: user.foto_perfil || user.avatarUrl || undefined,
    // Agrega otros campos si es necesario
  };
}

export default function UserDialog({ open, onOpenChange, mode, user, onSubmit, loading }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  user?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? '' : 'hidden'}`}> {/* Simula un modal */}
      <div className="bg-white rounded shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-bold mb-4">{mode === "create" ? "Crear Usuario" : "Editar Usuario"}</h2>
        {loading ? (
          <UserFormSkeleton />
        ) : (
          <UserForm mode={mode} initialValues={mapUserToForm(user)} onSubmit={onSubmit} />
        )}
        <button className="mt-4 text-sm text-gray-500 underline" onClick={() => onOpenChange(false)}>Cerrar</button>
      </div>
    </div>
  );
} 