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
    
    // Consultar estados únicos de la tabla prefapp_lotes
    const estadosRes = await client.query(`
      SELECT DISTINCT estado 
      FROM public.prefapp_lotes 
      WHERE estado IS NOT NULL
      ORDER BY estado
    `);
    
    estadosRes.rows.forEach((row, index) => {
      console.log(`${index + 1}. "${row.estado}" (longitud: ${row.estado?.length})`);
    });
    
    // También mostrar conteo por estado
    const conteoRes = await client.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM public.prefapp_lotes 
      WHERE estado IS NOT NULL
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
    
    conteoRes.rows.forEach(row => {
      console.log(`"${row.estado}": ${row.cantidad} lotes`);
    });
    
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    throw err;
  } finally {
    await client.end();
  }
} 