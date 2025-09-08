import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    
    // Probar conexión básica
    const client = await pool.connect();
    
    try {
      // Verificar que la tabla prefapp_users existe
      const { rows: tableCheck } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'prefapp_users'
        );
      `);
      
      const tableExists = tableCheck[0].exists;
      
      if (!tableExists) {
        return NextResponse.json({ 
          error: 'La tabla prefapp_users no existe',
          connection: 'OK',
          tableExists: false
        }, { status: 500 });
      }
      
      // Verificar la estructura de la tabla prefapp_users
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'prefapp_users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      
      // Contar usuarios
      const { rows: userCount } = await client.query('SELECT COUNT(*) as total FROM public.prefapp_users');
      const totalUsers = parseInt(userCount[0].total, 10);
      
      
      return NextResponse.json({ 
        message: 'Conexión exitosa a la base de datos',
        connection: 'OK',
        tableExists: true,
        totalUsers,
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES'
        }))
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error de conexión a la base de datos', 
      details: (error as Error).message,
      connection: 'FAILED'
    }, { status: 500 });
  }
} 