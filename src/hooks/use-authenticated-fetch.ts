import { useCallback } from 'react';

export function useAuthenticatedFetch() {
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };
    
    return fetch(url, {
      ...options,
      headers,
    });
  }, []);
  
  return { authenticatedFetch };
}
