"use server";

import { Client } from "pg";

export async function testPostgresConnection() {
  const client = new Client({
    user: 'developer',
    host: '34.45.139.58',
    database: 'prefapp',
    password: 'Dev!2025',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('¡Conexión exitosa a la base de datos PostgreSQL!');
    // Ejemplo: obtener las tablas públicas
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tablas en el esquema public:', res.rows);
    // Ejemplo: obtener los primeros 5 registros de alguna tabla (si existe)
    if (res.rows.length > 0) {
      const firstTable = res.rows[0].table_name;
      const data = await client.query(`SELECT * FROM "${firstTable}" LIMIT 5`);
      console.log(`Primeros 5 registros de la tabla ${firstTable}:`, data.rows);
    }
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    throw err;
  } finally {
    await client.end();
  }
} 