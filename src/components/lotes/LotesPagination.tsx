import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LotesPaginationProps {
  currentPage: number;
  totalPages: number;
  createQueryString: (params: Record<string, string | number | null>) => string;
  pathname: string;
}

const LotesPagination: React.FC<LotesPaginationProps> = ({ currentPage, totalPages, createQueryString, pathname }) => {
  // No mostrar paginación si hay 1 página o menos
  if (totalPages <= 1) return null;
  
  // Si la página actual es mayor que el total de páginas, no mostrar paginación
  // (esto debería ser manejado por la lógica de redirección en el componente padre)
  if (currentPage > totalPages) return null;

   // Calcular las páginas a mostrar de manera dinámica
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    // Si hay 7 páginas o menos, mostrar todas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Lógica para mostrar páginas alrededor de la actual
    // Siempre mostrar la primera página
    pages.push(1);
    
    // Determinar el rango de páginas a mostrar alrededor de currentPage
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Ajustar si estamos cerca del inicio
    if (currentPage <= 3) {
      startPage = 2;
      endPage = Math.min(4, totalPages - 1);
    }
    
    // Ajustar si estamos cerca del final
    if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3);
      endPage = totalPages - 1;
    }
    
    // Agregar "..." si hay gap entre 1 y startPage
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Agregar páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Agregar "..." si hay gap entre endPage y última página
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Siempre mostrar la última página
    pages.push(totalPages);
  }
  
  // Debug: Ver qué páginas se están generando
  // console.log('Paginador - totalPages:', totalPages, 'currentPage:', currentPage, 'pages:', pages);

  return (
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={`${pathname}?${createQueryString({ page: currentPage - 1 })}`} />
            </PaginationItem>
          )}
          {pages.map((page, i) =>
            page === '...'
              ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <span className="px-2">...</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={`${pathname}?${createQueryString({ page })}`}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
          )}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext href={`${pathname}?${createQueryString({ page: currentPage + 1 })}`} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default LotesPagination; 