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
  return (
    <div className="mt-8 flex justify-center">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={`${pathname}?${createQueryString({ page: currentPage - 1 })}`} />
            </PaginationItem>
          )}
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href={`${pathname}?${createQueryString({ page: i + 1 })}`}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
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