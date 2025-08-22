"use client";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  pages: number;
  start: number;
  end: number;
}

interface PaginationProps {
  paginationData: PaginationData;
  onPageChange: (newOffset: number) => Promise<void>;
  loading?: boolean;
}

const usePagination = (
  paginationData: PaginationData,
  onPageChange: PaginationProps["onPageChange"]
) => {
  const [isLoading, setIsLoading] = useState(false);

  console.log("Pagination Data:", paginationData);
  const currentPage =
    Math.floor(paginationData.start / paginationData.limit) + 1;
  console.log("Current Page:", currentPage);
  const goToPage = async (page: number) => {
    if (page < 1 || page > paginationData.pages || isLoading) return;
    const newOffset = (page - 1) * paginationData.limit;
    setIsLoading(true);

    try {
      await onPageChange(newOffset);
    } catch (error) {
      console.error("Error al cambiar página:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  return {
    currentPage,
    isLoading,
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
};

export const PaginationComponent: React.FC<PaginationProps> = ({
  paginationData,
  onPageChange,
  loading = false,
}) => {
  const { currentPage, isLoading, goToPage, goToNextPage, goToPrevPage } =
    usePagination(paginationData, onPageChange);

  const totalLoading = loading || isLoading;

  // Función para generar números de página visibles
  const getVisiblePages = () => {
    const delta = 2; // Páginas a mostrar a cada lado de la actual
    const range = [];
    const rangeWithDots = [];

    // Si hay pocas páginas, mostrar todas
    if (paginationData.pages <= 7) {
      for (let i = 1; i <= paginationData.pages; i++) {
        range.push(i);
      }
      return range;
    }

    // Lógica para páginas con puntos suspensivos
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(paginationData.pages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < paginationData.pages - 1) {
      rangeWithDots.push("...", paginationData.pages);
    } else if (paginationData.pages > 1) {
      rangeWithDots.push(paginationData.pages);
    }

    return rangeWithDots;
  };

  if (paginationData.pages <= 1) {
    return null; // No mostrar paginación si hay una sola página o menos
  }

  const startItem = paginationData.offset + 1;
  const endItem = Math.min(
    paginationData.offset + paginationData.limit,
    paginationData.total
  );
  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      {/* Información de resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {paginationData.total} resultados
      </div>

      {/* Componente de paginación de shadcn */}
      <Pagination>
        <PaginationContent>
          {/* Botón página anterior */}
          <PaginationItem>
            <PaginationPrevious
              onClick={goToPrevPage}
              className={`${
                currentPage === 1 || totalLoading
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }`}
            />
          </PaginationItem>

          {/* Números de página */}
          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => goToPage(page as number)}
                  isActive={page === currentPage}
                  className={`${
                    totalLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Botón página siguiente */}
          <PaginationItem>
            <PaginationNext
              onClick={goToNextPage}
              className={`${
                currentPage === paginationData.pages || totalLoading
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Indicador de carga */}
      {totalLoading && (
        <div className="text-sm text-muted-foreground flex items-center space-x-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          <span>Cargando...</span>
        </div>
      )}
    </div>
  );
};
