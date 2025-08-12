import pool from "../src/lib/db";
import bcrypt from "bcryptjs";

async function hashAllPasswords() {
  try {
    // 1. Obtener todos los usuarios
    const { rows: users } = await pool.query('SELECT id, "user", password FROM public.prefapp_users');
    for (const user of users) {
      const password = user.password;
      // Si ya está hasheada (empieza con $2), la saltamos
      if (typeof password === 'string' && password.startsWith('$2')) {
        continue;
      }
      // 2. Hashear la contraseña
      const hash = await bcrypt.hash(password, 10);
      // 3. Actualizar en la base
      await pool.query('UPDATE public.prefapp_users SET password = $1 WHERE id = $2', [hash, user.id]);
    }
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

hashAllPasswords(); 