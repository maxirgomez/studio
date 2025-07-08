import React, { useEffect, useState } from "react";
import UserCard from "./UserCard";

export default function UserList({ onEditUser }: { onEditUser?: (user: any) => void }) {
  const [usersByRole, setUsersByRole] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div>
      {Object.entries(usersByRole).map(([role, users]) => (
        <div key={role} className="mb-6">
          <h2 className="text-xl font-bold mb-2">{role}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map(user => (
              <UserCard key={user.mail || user.email} user={user} onEdit={() => onEditUser?.(user)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 