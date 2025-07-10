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
  if (totalPages <= 1) return null;

  // Calcular las páginas a mostrar
  const pages = [];
  if (currentPage > 2) {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
  }
  if (currentPage > 1) pages.push(currentPage - 1);
  pages.push(currentPage);
  if (currentPage < totalPages) pages.push(currentPage + 1);
  if (currentPage < totalPages - 1) {
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

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