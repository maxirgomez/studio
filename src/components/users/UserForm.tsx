import React, { useState } from "react";
import * as z from "zod";

const userSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.string().min(2, "El rol es obligatorio"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  avatar: z.any().optional(),
});

export default function UserForm({ mode, initialValues, onSubmit, loading }: {
  mode: "create" | "edit";
  initialValues?: any;
  onSubmit: (values: any) => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState(initialValues || {});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = userSchema.safeParse({
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      email: form.email,
      role: form.role,
      password: mode === "create" ? form.password : (form.password || undefined),
      avatar: avatarFile,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    if (mode === "create" && !form.password) {
      setError("La contraseña es obligatoria");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        const formData = new FormData();
        formData.append("nombre", form.firstName);
        formData.append("apellido", form.lastName);
        formData.append("user", form.username);
        formData.append("mail", form.email);
        formData.append("rol", form.role);
        if (form.password) formData.append("password", form.password);
        if (avatarFile) formData.append("avatar", avatarFile);
        const res = await fetch("/api/users", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al crear usuario");
        } else {
          setSuccess("Usuario creado exitosamente");
          onSubmit(form);
        }
      } else {
        const payload = {
          nombre: form.firstName,
          apellido: form.lastName,
          mail: form.email,
          rol: form.role,
          user: form.username,
          password: form.password || undefined,
        };
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al actualizar usuario");
        } else {
          setSuccess("Usuario actualizado exitosamente");
          onSubmit(form);
        }
      }
    } catch (err) {
      setError("Error de red");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Nombre"
        name="firstName"
        defaultValue={form.firstName}
        onChange={handleChange}
        disabled={submitting || loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="Apellido"
        name="lastName"
        defaultValue={form.lastName}
        onChange={handleChange}
        disabled={submitting || loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="Email"
        name="email"
        defaultValue={form.email}
        onChange={handleChange}
        disabled={submitting || loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="Rol"
        name="role"
        defaultValue={form.role}
        onChange={handleChange}
        disabled={submitting || loading}
      />
      {mode === "create" && (
        <input
          className="border p-2 w-full"
          placeholder="Nombre de usuario"
          name="username"
          defaultValue={form.username}
          onChange={handleChange}
          disabled={submitting || loading}
        />
      )}
      <input
        className="border p-2 w-full"
        placeholder="Contraseña"
        name="password"
        type="password"
        onChange={handleChange}
        disabled={submitting || loading}
        required={mode === "create"}
      />
      <input
        className="border p-2 w-full"
        type="file"
        accept="image/*"
        name="avatar"
        onChange={handleFileChange}
        disabled={submitting || loading}
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={submitting || loading}>
        {submitting ? "Enviando..." : mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
      </button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
    </form>
  );
} 