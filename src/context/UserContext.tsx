'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface User {
  id?: number;
  user: string;
  mail: string;
  nombre: string;
  apellido: string;
  rol: string;
  foto_perfil?: string;
  estados?: Array<{ estado: string; cantidad: number }>;
  estadosDisponibles?: string[];
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser debe usarse dentro de UserProvider");
  return ctx;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    console.log('🔄 UserContext - refreshUser iniciado');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔍 UserContext - Token:', token ? 'ENCONTRADO' : 'NO ENCONTRADO');
      console.log('🔍 UserContext - Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('❌ UserContext - Sin token, estableciendo user como null');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('📡 UserContext - Haciendo petición a /api/me...');
      const res = await fetch("/api/me", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 UserContext - Respuesta:', res.status, res.statusText);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ UserContext - Datos recibidos:', data);
        console.log('✅ UserContext - data.user:', data.user);
        console.log('✅ UserContext - Estableciendo usuario:', data.user ? 'SÍ' : 'NO');
        setUser(data.user || null);
      } else {
        const errorData = await res.json();
        console.error('❌ UserContext - Error:', errorData);
        setUser(null);
      }
    } catch (e) {
      console.error('💥 UserContext - Excepción:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 UserContext - useEffect ejecutado');
    
    // Verificar si hay token en localStorage al montar
    const token = localStorage.getItem('auth_token');
    console.log('🔍 UserContext - Token al montar:', token ? 'ENCONTRADO' : 'NO ENCONTRADO');
    
    if (token) {
      console.log('🔄 UserContext - Token encontrado, llamando a refreshUser');
      refreshUser();
    } else {
      console.log('❌ UserContext - Sin token al montar, estableciendo user como null');
      setUser(null);
      setLoading(false);
    }
  }, [refreshUser]);

  // Efecto adicional para verificar el token periódicamente
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('auth_token');
      if (token && !user) {
        console.log('🔄 UserContext - Token encontrado pero user es null, recargando...');
        refreshUser();
      }
    };

    // Verificar cada 2 segundos si hay token pero no hay usuario
    const interval = setInterval(checkToken, 2000);
    
    return () => clearInterval(interval);
  }, [user, refreshUser]);

  console.log('🔄 UserContext - Renderizando, user:', user, 'loading:', loading);
  console.log('🔄 UserContext - user?.nombre:', user?.nombre);
  console.log('🔄 UserContext - user?.apellido:', user?.apellido);
  console.log('🔄 UserContext - user?.mail:', user?.mail);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}; 