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

  const minAreaFilter = useMemo(() => searchParams.get('minArea') ? Number(searchParams.get('minArea')) : minArea, [searchParams, minArea]);
  const maxAreaFilter = useMemo(() => searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : maxArea, [searchParams, maxArea]);

  const [areaInput, setAreaInput] = useState<[string, string]>(['', '']);
  const [sliderValue, setSliderValue] = useState<[number, number]>([minArea, maxArea]);
  
  const uniqueNeighborhoods = useMemo(() => [...new Set(listings.map(l => l.neighborhood))], []);
  const uniqueStatuses = useMemo(() => [...new Set(listings.map(l => l.status))], []);
  const uniqueOrigens = useMemo(() => [...new Set(listings.map(l => l.origen))], []);
  
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

  const totalPages = Math.ceil(filteredListings.length / listingsPerPage);
  const listingsOnPage = filteredListings.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  ) as Listing[];


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
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Lotes</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="SMP o Dirección" className="pl-8" />
            </div>
            <Link href="/lotes/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Lote
              </Button>
            </Link>
          </div>
        </div>
        <Suspense fallback={<ListingCardSkeleton />}>
          {listingsOnPage.length === 0 && !loading ? (
            <div className="flex justify-center items-center h-64 text-lg text-muted-foreground">No se encontraron lotes con los filtros seleccionados.</div>
          ) : (
            <LotesGrid listings={listingsOnPage} loading={loading} />
          )}
        </Suspense>
        <LotesPagination
          currentPage={currentPage}
          totalPages={totalPages}
          createQueryString={createQueryString}
          pathname={pathname}
        />
      </div>
    </div>
  );
} 