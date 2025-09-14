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

  // Calcular las páginas a mostrar de manera compacta
  const pages = [];
  
  if (totalPages <= 5) {
    // Si hay 5 páginas o menos, mostrar todas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Si hay más de 5 páginas, mostrar formato compacto: 1, 2, 3 ... último
    pages.push(1);
    pages.push(2);
    pages.push(3);
    
    // Siempre mostrar puntos suspensivos si hay más de 4 páginas
    if (totalPages > 4) {
      pages.push('...');
    }
    
    // Siempre mostrar la última página si hay más de 3 páginas
    if (totalPages > 3) {
      pages.push(totalPages);
    }
  }
  
  // Debug: Ver qué páginas se están generando
  console.log('Paginador - totalPages:', totalPages, 'currentPage:', currentPage, 'pages:', pages);

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