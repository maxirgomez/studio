"use client";

import Image from "next/image";
import * as React from "react";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  MapPin,
  Ruler,
  Search,
  Plus,
  X,
  ChevronDown
} from "lucide-react";
import { users, getStatusStyles } from "@/lib/data";
import ListingCard from "@/components/lotes/ListingCard";
import LotesFilters from "@/components/lotes/LotesFilters";
import LotesGrid from "@/components/lotes/LotesGrid";
import { Listing } from "@/components/lotes/ListingCard";
import LotesPagination from "@/components/lotes/LotesPagination";
import ListingCardSkeleton from "@/components/lotes/ListingCardSkeleton";
import { useUser } from "@/context/UserContext";
import { useBarrios, useEstados, useOrigenes, useTipos, useAgentes, useAreaRange, useFrenteRange } from "@/hooks/use-lotes-filters";
import { useLotesList } from "@/hooks/use-lotes-list";



export default function LotesClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUser();

  const [minArea, setMinArea] = useState(0);
  const [maxArea, setMaxArea] = useState(1000);
  const [minFrente, setMinFrente] = useState(0);
  const [maxFrente, setMaxFrente] = useState(50);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const listingsPerPage = 8;

  const agentFilters = useMemo(() => searchParams.get('agent')?.split(',') || [], [searchParams]);
  const neighborhoodFilters = useMemo(() => searchParams.get('neighborhood')?.split(',') || [], [searchParams]);
  const statusFilters = useMemo(() => searchParams.get('status')?.split(',') || [], [searchParams]);
  const origenFilters = useMemo(() => searchParams.get('origen')?.split(',') || [], [searchParams]);
  const tipoFilters = useMemo(() => searchParams.get('tipo')?.split(',') || [], [searchParams]);
  const esquinaFilters = useMemo(() => searchParams.get('esquina')?.split(',') || [], [searchParams]);
  const searchFilter = useMemo(() => searchParams.get('search') || '', [searchParams]);
  const sortBy = useMemo(() => searchParams.get('sortBy') || 'gid', [searchParams]);
  const sortOrder = useMemo(() => (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc', [searchParams]);

  const minAreaFilter = useMemo(() => searchParams.get('minArea') ? Number(searchParams.get('minArea')) : minArea, [searchParams, minArea]);
  const maxAreaFilter = useMemo(() => searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : maxArea, [searchParams, maxArea]);
  const minFrenteFilter = useMemo(() => searchParams.get('minFrente') ? Number(searchParams.get('minFrente')) : minFrente, [searchParams, minFrente]);
  const maxFrenteFilter = useMemo(() => searchParams.get('maxFrente') ? Number(searchParams.get('maxFrente')) : maxFrente, [searchParams, maxFrente]);

  const [areaInput, setAreaInput] = useState<[string, string]>(['', '']);
  const [sliderValue, setSliderValue] = useState<[number, number]>([minArea, maxArea]);
  const [frenteInput, setFrenteInput] = useState<[string, string]>(['', '']);
  const [frenteSliderValue, setFrenteSliderValue] = useState<[number, number]>([minFrente, maxFrente]);
  
  // ✅ REACT QUERY: Usar hooks con caché para opciones de filtros
  const { data: uniqueNeighborhoods = [] } = useBarrios();
  const { data: uniqueStatuses = [] } = useEstados();
  const { data: uniqueOrigens = [] } = useOrigenes();
  const { data: uniqueTipos = [] } = useTipos();
  const { data: uniqueAgents = [] } = useAgentes();
  const { data: areaRangeData } = useAreaRange();
  const { data: frenteRangeData } = useFrenteRange();

  // Actualizar minArea/maxArea cuando lleguen los datos del caché
  useEffect(() => {
    if (areaRangeData) {
      setMinArea(areaRangeData.minArea);
      setMaxArea(areaRangeData.maxArea);
    }
  }, [areaRangeData]);

  useEffect(() => {
    if (frenteRangeData) {
      setMinFrente(frenteRangeData.minFrente);
      setMaxFrente(frenteRangeData.maxFrente);
    }
  }, [frenteRangeData]);
  
  useEffect(() => {
    // Solo mostrar valores en los inputs si hay un filtro activo (no es el rango completo)
    if (minAreaFilter > minArea || maxAreaFilter < maxArea) {
      setAreaInput([String(minAreaFilter), String(maxAreaFilter)]);
      setSliderValue([minAreaFilter, maxAreaFilter]);
    } else {
      // Si no hay filtro activo, dejar los inputs vacíos
      setAreaInput(['', '']);
      setSliderValue([minArea, maxArea]);
    }
  }, [minAreaFilter, maxAreaFilter, minArea, maxArea]);

  useEffect(() => {
    // Solo mostrar valores en los inputs si hay un filtro activo (no es el rango completo)
    if (minFrenteFilter > minFrente || maxFrenteFilter < maxFrente) {
      setFrenteInput([String(minFrenteFilter), String(maxFrenteFilter)]);
      setFrenteSliderValue([minFrenteFilter, maxFrenteFilter]);
    } else {
      // Si no hay filtro activo, dejar los inputs vacíos
      setFrenteInput(['', '']);
      setFrenteSliderValue([minFrente, maxFrente]);
    }
  }, [minFrenteFilter, maxFrenteFilter, minFrente, maxFrente]);
  
  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(paramsToUpdate)) {
        if (value === null || value === 'todos' || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleMultiSelectFilterChange = (key: string, value: string) => {
    const currentValues = searchParams.get(key)?.split(',') || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    router.push(`${pathname}?${createQueryString({ [key]: newValues.length > 0 ? newValues.join(',') : null, page: 1 })}`, { scroll: false });
  };
  
  const handleRemoveFilter = (key: string, valueToRemove: string) => {
    if (key === 'area') {
      router.push(`${pathname}?${createQueryString({ minArea: null, maxArea: null, page: 1 })}`, { scroll: false });
    } else if (key === 'frente') {
      router.push(`${pathname}?${createQueryString({ minFrente: null, maxFrente: null, page: 1 })}`, { scroll: false });
    } else {
      const currentValues = searchParams.get(key)?.split(',') || [];
      const newValues = currentValues.filter(v => v !== valueToRemove);
      router.push(`${pathname}?${createQueryString({ [key]: newValues.length > 0 ? newValues.join(',') : null, page: 1 })}`, { scroll: false });
    }
  };

  const handleAreaInputChange = (index: 0 | 1, value: string) => {
    const newInputs = [...areaInput] as [string, string];
    newInputs[index] = value;
    setAreaInput(newInputs);
  };
  
  const handleAreaInputBlur = () => {
    let newMin = Number(areaInput[0]);
    let newMax = Number(areaInput[1]);

    if (isNaN(newMin) || newMin < minArea) newMin = minArea;
    if (isNaN(newMax) || newMax > maxArea) newMax = maxArea;
    if (newMin > maxArea) newMin = maxArea;
    if (newMax < minArea) newMax = minArea;
    if (newMin > newMax) {
      [newMin, newMax] = [newMax, newMin];
    }
    
    if (newMin !== minAreaFilter || newMax !== maxAreaFilter) {
      router.push(`${pathname}?${createQueryString({ minArea: String(newMin), maxArea: String(newMax), page: 1 })}`, { scroll: false });
    }
  };
  
  const handleSliderVisualChange = (newRange: [number, number]) => {
    setSliderValue(newRange);
    setAreaInput([String(newRange[0]), String(newRange[1])])
  };
  
  const handleSliderFilterCommit = (newRange: [number, number]) => {
     router.push(`${pathname}?${createQueryString({ minArea: String(newRange[0]), maxArea: String(newRange[1]), page: 1 })}`, { scroll: false });
  };

  const handleFrenteInputChange = (index: 0 | 1, value: string) => {
    const newInputs = [...frenteInput] as [string, string];
    newInputs[index] = value;
    setFrenteInput(newInputs);
  };
  
  const handleFrenteInputBlur = () => {
    let newMin = Number(frenteInput[0]);
    let newMax = Number(frenteInput[1]);

    if (isNaN(newMin) || newMin < minFrente) newMin = minFrente;
    if (isNaN(newMax) || newMax > maxFrente) newMax = maxFrente;
    if (newMin > maxFrente) newMin = maxFrente;
    if (newMax < minFrente) newMax = minFrente;
    if (newMin > newMax) {
      [newMin, newMax] = [newMax, newMin];
    }
    
    if (newMin !== minFrenteFilter || newMax !== maxFrenteFilter) {
      router.push(`${pathname}?${createQueryString({ minFrente: String(newMin), maxFrente: String(newMax), page: 1 })}`, { scroll: false });
    }
  };
  
  const handleFrenteSliderVisualChange = (newRange: [number, number]) => {
    setFrenteSliderValue(newRange);
    setFrenteInput([String(newRange[0]), String(newRange[1])])
  };
  
  const handleFrenteSliderFilterCommit = (newRange: [number, number]) => {
     router.push(`${pathname}?${createQueryString({ minFrente: String(newRange[0]), maxFrente: String(newRange[1]), page: 1 })}`, { scroll: false });
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    router.push(`${pathname}?${createQueryString({ sortBy: 'm2aprox', sortOrder: newOrder, page: 1 })}`, { scroll: false });
  };

  // Hook de debounce para el buscador
  const [searchInput, setSearchInput] = useState(searchFilter);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchFilter) {
        router.push(`${pathname}?${createQueryString({ search: searchInput || null, page: 1 })}`, { scroll: false });
      }
    }, 500); // 500ms de debounce

    return () => clearTimeout(timer);
  }, [searchInput, searchFilter, pathname, createQueryString, router]);

  const handleSearchChange = (searchTerm: string) => {
    setSearchInput(searchTerm);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      router.push(`${pathname}?${createQueryString({ search: searchInput || null, page: 1 })}`, { scroll: false });
    }
  };

  // Los filtros se aplican directamente en la API, no necesitamos filtrar aquí

  const activeFilters: { type: string; value: string; key: string }[] = [];
  agentFilters.forEach(value => activeFilters.push({ type: 'Agente', value, key: 'agent' }));
  neighborhoodFilters.forEach(value => activeFilters.push({ type: 'Barrio', value, key: 'neighborhood' }));
  origenFilters.forEach(value => activeFilters.push({ type: 'Origen', value, key: 'origen' }));
  statusFilters.forEach(value => activeFilters.push({ type: 'Estado', value, key: 'status' }));
  tipoFilters.forEach(value => activeFilters.push({ type: 'Tipo', value, key: 'tipo' }));
  esquinaFilters.forEach(value => activeFilters.push({ type: 'Esquina', value, key: 'esquina' }));
  // Solo mostrar filtro de área si realmente está aplicado (no es el rango completo)
  if (minAreaFilter > minArea || maxAreaFilter < maxArea) {
      activeFilters.push({
          type: 'M²',
          value: `${minAreaFilter} - ${maxAreaFilter}`,
          key: 'area'
      });
  }
  // Solo mostrar filtro de frente si realmente está aplicado (no es el rango completo)
  if (minFrenteFilter > minFrente || maxFrenteFilter < maxFrente) {
      activeFilters.push({
          type: 'Frente',
          value: `${minFrenteFilter} - ${maxFrenteFilter}`,
          key: 'frente'
      });
  }

  // ✅ REACT QUERY: Usar hook con caché para listado de lotes
  const { 
    lotes: realListings, 
    total, 
    isLoading: loadingRealListings,
    prefetchNextPage 
  } = useLotesList({
    page: currentPage,
    limit: listingsPerPage,
    agent: agentFilters.length > 0 ? agentFilters : undefined,
    neighborhood: neighborhoodFilters.length > 0 ? neighborhoodFilters : undefined,
    status: statusFilters.length > 0 ? statusFilters : undefined,
    origen: origenFilters.length > 0 ? origenFilters : undefined,
    tipo: tipoFilters.length > 0 ? tipoFilters : undefined,
    esquina: esquinaFilters.length > 0 ? esquinaFilters : undefined,
    minArea: minAreaFilter !== minArea ? minAreaFilter : undefined,
    maxArea: maxAreaFilter !== maxArea ? maxAreaFilter : undefined,
    minFrente: minFrenteFilter !== minFrente ? minFrenteFilter : undefined,
    maxFrente: maxFrenteFilter !== maxFrente ? maxFrenteFilter : undefined,
    search: searchFilter || undefined,
    sortBy: sortBy !== 'gid' ? sortBy : undefined,
    sortOrder: sortOrder !== 'asc' ? sortOrder : undefined,
  });

  // Prefetch de página siguiente para navegación más rápida
  useEffect(() => {
    if (!loadingRealListings && total > 0) {
      prefetchNextPage();
    }
  }, [currentPage, total, loadingRealListings, prefetchNextPage]);

  // Redirigir a página 1 si no hay lotes en la página actual
  useEffect(() => {
    if (!loadingRealListings && realListings.length === 0 && currentPage > 1) {
      router.push(`${pathname}?${createQueryString({ page: 1 })}`, { scroll: false });
    }
  }, [realListings, loadingRealListings, currentPage, router, pathname, createQueryString]);

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <LotesFilters
          origenFilters={origenFilters}
          statusFilters={statusFilters}
          neighborhoodFilters={neighborhoodFilters}
          agentFilters={agentFilters}
          tipoFilters={tipoFilters}
          esquinaFilters={esquinaFilters}
          uniqueOrigens={uniqueOrigens}
          uniqueStatuses={uniqueStatuses}
          uniqueNeighborhoods={uniqueNeighborhoods}
          uniqueTipos={uniqueTipos}
          uniqueAgents={uniqueAgents}
          users={users}
          sliderValue={sliderValue}
          minArea={minArea}
          maxArea={maxArea}
          areaInput={areaInput}
          frenteSliderValue={frenteSliderValue}
          minFrente={minFrente}
          maxFrente={maxFrente}
          frenteInput={frenteInput}
          handleMultiSelectFilterChange={handleMultiSelectFilterChange}
          handleAreaInputChange={handleAreaInputChange}
          handleAreaInputBlur={handleAreaInputBlur}
          handleSliderVisualChange={handleSliderVisualChange}
          handleSliderFilterCommit={handleSliderFilterCommit}
          handleFrenteInputChange={handleFrenteInputChange}
          handleFrenteInputBlur={handleFrenteInputBlur}
          handleFrenteSliderVisualChange={handleFrenteSliderVisualChange}
          handleFrenteSliderFilterCommit={handleFrenteSliderFilterCommit}
          activeFilters={activeFilters}
          handleRemoveFilter={handleRemoveFilter}
          sortOrder={sortOrder}
          onSortOrderToggle={handleSortOrderToggle}
          currentUser={currentUser}
        />
      </div>
             {/* Botón '+ Nuevo Lote' y buscador arriba de la grilla */}
       <div className="lg:col-span-1 flex flex-col gap-4">
         <div className="flex justify-between items-center mb-2 gap-4">
           <div className="flex-1 max-w-md">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Buscar por SMP, dirección, barrio, estado, origen o agente..."
                 value={searchInput}
                 onChange={(e) => handleSearchChange(e.target.value)}
                 onKeyDown={handleSearchKeyDown}
                 className="pl-10"
               />
             </div>
           </div>
           <div className="flex items-center gap-4">
             <Link href="/lotes/nuevo">
               <Button className="flex items-center gap-2">
                 <Plus className="h-4 w-4" />
                 Nuevo Lote
               </Button>
             </Link>
           </div>
         </div>
        <LotesGrid listings={realListings} loading={loadingRealListings} />
        <LotesPagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / listingsPerPage)}
          createQueryString={createQueryString}
          pathname={pathname}
        />
      </div>
    </div>
  );
} 