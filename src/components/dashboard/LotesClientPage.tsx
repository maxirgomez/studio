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
  Scan,
  Ruler,
  Search,
  Plus,
  X,
  ChevronDown
} from "lucide-react";
import { users, listings, getStatusStyles } from "@/lib/data";
import ListingCard from "@/components/lotes/ListingCard";
import LotesFilters from "@/components/lotes/LotesFilters";
import LotesGrid from "@/components/lotes/LotesGrid";
import { Listing } from "@/components/lotes/ListingCard";
import LotesPagination from "@/components/lotes/LotesPagination";
import ListingCardSkeleton from "@/components/lotes/ListingCardSkeleton";

function capitalizeWords(str: string) {
  return str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export default function LotesClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allAreas = useMemo(() => listings.map(l => l.area), []);
  const minArea = useMemo(() => Math.min(...allAreas), [allAreas]);
  const maxArea = useMemo(() => Math.max(...allAreas), [allAreas]);
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const listingsPerPage = 8;

  const agentFilters = useMemo(() => searchParams.get('agent')?.split(',') || [], [searchParams]);
  const neighborhoodFilters = useMemo(() => searchParams.get('neighborhood')?.split(',') || [], [searchParams]);
  const statusFilters = useMemo(() => searchParams.get('status')?.split(',') || [], [searchParams]);
  const origenFilters = useMemo(() => searchParams.get('origen')?.split(',') || [], [searchParams]);
  const searchFilter = useMemo(() => searchParams.get('search') || '', [searchParams]);

  const minAreaFilter = useMemo(() => searchParams.get('minArea') ? Number(searchParams.get('minArea')) : minArea, [searchParams, minArea]);
  const maxAreaFilter = useMemo(() => searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : maxArea, [searchParams, maxArea]);

  const [areaInput, setAreaInput] = useState<[string, string]>(['', '']);
  const [sliderValue, setSliderValue] = useState<[number, number]>([minArea, maxArea]);
  
  const [uniqueNeighborhoods, setUniqueNeighborhoods] = useState<string[]>([]);
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
  const [uniqueOrigens, setUniqueOrigens] = useState<string[]>([]);
  const [uniqueAgents, setUniqueAgents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBarrios() {
      const res = await fetch('/api/lotes/barrios');
      const data = await res.json();
      setUniqueNeighborhoods(data.barrios || []);
    }
    fetchBarrios();
  }, []);

  useEffect(() => {
    async function fetchEstados() {
      const res = await fetch('/api/lotes/estados');
      const data = await res.json();
      setUniqueStatuses(data.estados || []);
    }
    fetchEstados();
  }, []);
  
  useEffect(() => {
    async function fetchOrigenes() {
      const res = await fetch('/api/lotes/origenes');
      const data = await res.json();
      setUniqueOrigens(data.origenes || []);
    }
    fetchOrigenes();
  }, []);

  useEffect(() => {
    async function fetchAgentes() {
      const res = await fetch('/api/lotes/agentes');
      const data = await res.json();
      setUniqueAgents(data.agentes || []);
    }
    fetchAgentes();
  }, []);
  
  useEffect(() => {
    setAreaInput([String(minAreaFilter), String(maxAreaFilter)]);
    setSliderValue([minAreaFilter, maxAreaFilter]);
  }, [minAreaFilter, maxAreaFilter]);
  
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

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const agentMatch = agentFilters.length === 0 || agentFilters.includes(listing.agent.name);
      const neighborhoodMatch = neighborhoodFilters.length === 0 || neighborhoodFilters.includes(listing.neighborhood);
      const areaMatch = listing.area >= minAreaFilter && listing.area <= maxAreaFilter;
      const statusMatch = statusFilters.length === 0 || statusFilters.includes(listing.status);
      const origenMatch = origenFilters.length === 0 || origenFilters.includes(listing.origen);
      return agentMatch && neighborhoodMatch && areaMatch && statusMatch && origenMatch;
    });
  }, [agentFilters, neighborhoodFilters, minAreaFilter, maxAreaFilter, statusFilters, origenFilters]);

  const activeFilters: { type: string; value: string; key: string }[] = [];
  agentFilters.forEach(value => activeFilters.push({ type: 'Agente', value, key: 'agent' }));
  neighborhoodFilters.forEach(value => activeFilters.push({ type: 'Barrio', value, key: 'neighborhood' }));
  origenFilters.forEach(value => activeFilters.push({ type: 'Origen', value, key: 'origen' }));
  statusFilters.forEach(value => activeFilters.push({ type: 'Estado', value, key: 'status' }));
  if (minAreaFilter !== minArea || maxAreaFilter !== maxArea) {
      activeFilters.push({
          type: 'M²',
          value: `${minAreaFilter} - ${maxAreaFilter}`,
          key: 'area'
      });
  }

  const [loadingReal, setLoadingReal] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  useEffect(() => {
    setLoadingReal(true);
    setMinTimePassed(false);
    const timer = setTimeout(() => setMinTimePassed(true), 1000);
    const realTimer = setTimeout(() => setLoadingReal(false), 1500); // Simulación de carga real
    return () => {
      clearTimeout(timer);
      clearTimeout(realTimer);
    };
  }, [searchParams]);
  const loading = loadingReal || !minTimePassed;

  // Estado para los lotes reales
  const [realListings, setRealListings] = useState<Listing[]>([]);
  const [loadingRealListings, setLoadingRealListings] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar lotes por término de búsqueda
  const filteredRealListings = useMemo(() => {
    if (!searchTerm.trim()) return realListings;
    
    const term = searchTerm.toLowerCase().trim();
    return realListings.filter(lote => 
      lote.smp?.toLowerCase().includes(term) ||
      lote.address?.toLowerCase().includes(term) ||
      lote.neighborhood?.toLowerCase().includes(term)
    );
  }, [realListings, searchTerm]);

  useEffect(() => {
    setLoadingRealListings(true);
    const fetchLotes = async () => {
      const offset = (currentPage - 1) * listingsPerPage;
      const params = new URLSearchParams();
      params.set('limit', String(listingsPerPage));
      params.set('offset', String(offset));
      if (agentFilters.length > 0) params.set('agent', agentFilters.join(','));
      if (neighborhoodFilters.length > 0) params.set('neighborhood', neighborhoodFilters.join(','));
      if (statusFilters.length > 0) params.set('status', statusFilters.join(','));
      if (origenFilters.length > 0) params.set('origen', origenFilters.join(','));
      if (minAreaFilter !== minArea) params.set('minArea', String(minAreaFilter));
      if (maxAreaFilter !== maxArea) params.set('maxArea', String(maxAreaFilter));
      if (searchFilter) params.set('search', searchFilter);
      const res = await fetch(`/api/lotes?${params.toString()}`);
      const data = await res.json();
      const lotes = (data.lotes || []).map((lote: any) => ({
        ...lote,
        listingDate: lote.listingDate ? new Date(lote.listingDate) : null,
        saleDate: lote.saleDate ? new Date(lote.saleDate) : null,
      }));
      setRealListings(lotes);
      setTotal(data.total || 0);
      setLoadingRealListings(false);
    };
    fetchLotes();
  }, [currentPage, agentFilters, neighborhoodFilters, statusFilters, origenFilters, minAreaFilter, maxAreaFilter, searchFilter]);

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <LotesFilters
          origenFilters={origenFilters}
          statusFilters={statusFilters}
          neighborhoodFilters={neighborhoodFilters}
          agentFilters={agentFilters}
          uniqueOrigens={uniqueOrigens}
          uniqueStatuses={uniqueStatuses}
          uniqueNeighborhoods={uniqueNeighborhoods}
          uniqueAgents={uniqueAgents}
          users={users}
          sliderValue={sliderValue}
          minArea={minArea}
          maxArea={maxArea}
          areaInput={areaInput}
          handleMultiSelectFilterChange={handleMultiSelectFilterChange}
          handleAreaInputChange={handleAreaInputChange}
          handleAreaInputBlur={handleAreaInputBlur}
          handleSliderVisualChange={handleSliderVisualChange}
          handleSliderFilterCommit={handleSliderFilterCommit}
          activeFilters={activeFilters}
          handleRemoveFilter={handleRemoveFilter}
        />
      </div>
      {/* Botón '+ Nuevo Lote' y buscador arriba de la grilla */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2 gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SMP, dirección o barrio..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
          </div>
          <Link href="/lotes/nuevo">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Lote
            </Button>
          </Link>
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