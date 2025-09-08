"use server";

import { Client } from "pg";

export async function testPostgresConnection() {
  const client = new Client({
    user: 'developer',
    host: '34.136.69.128',
    database: 'prefapp',
    password: 'Dev!2025',
    port: 5432,
  });

  try {
    await client.connect();
    
    // Consultar estados únicos de la tabla prefapp_lotes
    const estadosRes = await client.query(`
      SELECT DISTINCT estado 
      FROM public.prefapp_lotes 
      WHERE estado IS NOT NULL
      ORDER BY estado
    `);
    
    
    // También mostrar conteo por estado
    const conteoRes = await client.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM public.prefapp_lotes 
      WHERE estado IS NOT NULL
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
} 