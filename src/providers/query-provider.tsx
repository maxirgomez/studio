"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Configuración de caché
        staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
        gcTime: 10 * 60 * 1000, // 10 minutos - garbage collection time (antes cacheTime)
        refetchOnWindowFocus: false, // No refetch al cambiar de tab
        refetchOnMount: 'always', // Siempre revalidar al montar (para datos críticos)
        retry: 1, // Solo 1 reintento en caso de error
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

