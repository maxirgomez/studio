
"use client";

import Image from "next/image";
import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Scan,
  Ruler,
  Search,
  Plus,
  X
} from "lucide-react";


const users = [
  {
    role: "Architect",
    name: "Maria Bailo Newton",
    username: "mbailo",
    email: "maria.bailo@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman professional",
    initials: "MN",
    lots: {
      tomarAccion: 5,
      tasacion: 2,
      evolucionando: 8,
      disponible: 10,
      descartado: 1,
      noVende: 3,
      reservado: 0,
      vendido: 4,
    },
  },
  {
    role: "Asesor",
    name: "Roxana Rajich",
    username: "rrajich",
    email: "roxana.rajich@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "woman smiling",
    initials: "RR",
    lots: {
      tomarAccion: 12,
      tasacion: 8,
      evolucionando: 15,
      disponible: 5,
      descartado: 2,
      noVende: 1,
      reservado: 3,
      vendido: 7,
    },
  },
  {
    role: "Asesor",
    name: "Santiago Liscovsky",
    username: "sliscovsky",
    email: "santiago.liscovsky@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man professional",
    initials: "SL",
    lots: {
      tomarAccion: 3,
      tasacion: 5,
      evolucionando: 7,
      disponible: 12,
      descartado: 0,
      noVende: 4,
      reservado: 2,
      vendido: 9,
    },
  },
  {
    role: "Asesor",
    name: "Martín Beorlegui",
    username: "mbeorlegui",
    email: "martin.beorlegui@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man portrait",
    initials: "MB",
    lots: {
      tomarAccion: 8,
      tasacion: 4,
      evolucionando: 10,
      disponible: 8,
      descartado: 3,
      noVende: 2,
      reservado: 1,
      vendido: 6,
    },
  },
  {
    role: "Asesor",
    name: "Iair Baredes",
    username: "ibaredes",
    email: "iair.baredes@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man happy",
    initials: "IB",
    lots: {
      tomarAccion: 7,
      tasacion: 6,
      evolucionando: 9,
      disponible: 11,
      descartado: 1,
      noVende: 1,
      reservado: 4,
      vendido: 5,
    },
  },
  {
    role: "Asesor",
    name: "Ariel Naem",
    username: "anaem",
    email: "Ariel.naem@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man with glasses",
    initials: "AN",
    lots: {
      tomarAccion: 9,
      tasacion: 3,
      evolucionando: 12,
      disponible: 7,
      descartado: 4,
      noVende: 0,
      reservado: 2,
      vendido: 8,
    },
  },
  {
    role: "Administrador",
    name: "Matías Poczter",
    username: "mpoczter",
    email: "Matias.poczter@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "person smiling",
    initials: "MP",
    lots: {
      tomarAccion: 2,
      tasacion: 1,
      evolucionando: 5,
      disponible: 15,
      descartado: 0,
      noVende: 0,
      reservado: 5,
      vendido: 20,
    },
  },
  {
    role: "Administrador",
    name: "Matias Chirom",
    username: "mchirom",
    email: "Matias.chirom@baigunrealty.com",
    avatarUrl: "https://placehold.co/100x100.png",
    aiHint: "man office",
    initials: "MC",
    lots: {
      tomarAccion: 4,
      tasacion: 3,
      evolucionando: 6,
      disponible: 18,
      descartado: 1,
      noVende: 2,
      reservado: 3,
      vendido: 15,
    },
  },
];

const listings = [
  {
    address: "Av. Santa Fe 1060",
    neighborhood: "Palermo",
    smp: "017-027-020A",
    area: 110,
    status: "Tomar Acción",
    agent: { name: "Ariel Naem", initials: "AN" },
    imageUrl: null,
    origen: "Tor",
  },
  {
    address: "Juramento 1196",
    neighborhood: "Belgrano",
    smp: "017-059-048D",
    area: 162,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern apartment building",
    origen: "Baigun Realty",
  },
  {
    address: "Rivadavia 1298",
    neighborhood: "Caballito",
    smp: "017-027-006",
    area: 185,
    status: "Evolucionando",
    agent: { name: "Iair Baredes", initials: "IB" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "storefront supermarket",
    origen: "Producción",
  },
  {
    address: "Corrientes 1341",
    neighborhood: "Almagro",
    smp: "031-036-034",
    area: 174,
    status: "Disponible",
    agent: { name: "Martín Beorlegui", initials: "MB" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "industrial warehouse",
    origen: "Tor",
  },
  {
    address: "Scalabrini Ortiz 1494",
    neighborhood: "Recoleta",
    smp: "017-026-022",
    area: 210,
    status: "Descartado",
    agent: { name: "Ariel Naem", initials: "AN" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "old city building",
    origen: "Baigun Realty",
  },
  {
    address: "Quintana 1577",
    neighborhood: "San Telmo",
    smp: "031-053-037",
    area: 150,
    status: "No vende",
    agent: { name: "Matías Poczter", initials: "MP" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "yellow historic house",
    origen: "Producción",
  },
  {
    address: "Defensa 1684",
    neighborhood: "Villa Crespo",
    smp: "031-055-029",
    area: 195,
    status: "Reservado",
    agent: { name: "Matias Chirom", initials: "MC" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "suburban brick house",
    origen: "Tor",
  },
  {
    address: "Login Exitoso",
    neighborhood: "Bienvenido, Admin!",
    smp: "031-114-032",
    area: 95,
    status: "Vendido",
    agent: { name: "Maria Bailo Newton", initials: "MN" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "red modern house",
    origen: "Baigun Realty",
  },
  {
    address: "Another Listing 1",
    neighborhood: "Palermo",
    smp: "017-027-021A",
    area: 120,
    status: "Tomar Acción",
    agent: { name: "Roxana Rajich", initials: "RR" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern house",
    origen: "Producción",
  },
  {
    address: "Another Listing 2",
    neighborhood: "Belgrano",
    smp: "017-059-049D",
    area: 170,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "luxury apartment",
    origen: "Tor",
  },
];

const getStatusStyles = (status: string): React.CSSProperties => {
  const styles: { [key: string]: { backgroundColor: string; color: string } } = {
    "Tomar Acción": { backgroundColor: "#669bbc", color: "#ffffff" },
    "Tasación": { backgroundColor: "#dda15e", color: "#ffffff" },
    "Evolucionando": { backgroundColor: "#219ebc", color: "#ffffff" },
    "Disponible": { backgroundColor: "#ffb703", color: "#000000" },
    "Descartado": { backgroundColor: "#0d1b2a", color: "#ffffff" },
    "No vende": { backgroundColor: "#c1121f", color: "#ffffff" },
    "Reservado": { backgroundColor: "#fb8500", color: "#ffffff" },
    "Vendido": { backgroundColor: "#4f772d", color: "#ffffff" },
  };

  return styles[status] || {};
};

const ListingCard = ({ listing }: { listing: (typeof listings)[0] }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-0">
      <div className="relative">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={listing.address}
            width={600}
            height={400}
            className="aspect-video object-cover"
            data-ai-hint={listing.aiHint}
          />
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Imagen no disponible</p>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg">{listing.address}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{listing.neighborhood}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Scan className="h-4 w-4 mr-2" />
          <span>SMP: {listing.smp}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Ruler className="h-4 w-4 mr-2" />
          <span>{listing.area} m² estimados</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="bg-card p-4 flex justify-between items-center">
        <Badge style={getStatusStyles(listing.status)}>{listing.status}</Badge>
        <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
                <AvatarFallback>{listing.agent.initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{listing.agent.name}</span>
        </div>
    </CardFooter>
  </Card>
);

export default function LotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const allAreas = useMemo(() => listings.map(l => l.area), []);
  const minArea = useMemo(() => Math.min(...allAreas), [allAreas]);
  const maxArea = useMemo(() => Math.max(...allAreas), [allAreas]);

  const agentFilter = searchParams.get('agent') || null;
  const neighborhoodFilter = searchParams.get('neighborhood') || null;
  const statusFilter = searchParams.get('status') || null;
  const origenFilter = searchParams.get('origen') || null;
  const minAreaFilter = searchParams.get('minArea') ? Number(searchParams.get('minArea')) : minArea;
  const maxAreaFilter = searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : maxArea;

  const [areaInput, setAreaInput] = useState<[string, string]>([String(minAreaFilter), String(maxAreaFilter)]);
  const [sliderValue, setSliderValue] = useState<[number, number]>([minAreaFilter, maxAreaFilter]);
  
  const uniqueNeighborhoods = useMemo(() => [...new Set(listings.map(l => l.neighborhood))], []);
  const uniqueStatuses = useMemo(() => [...new Set(listings.map(l => l.status))], []);
  const uniqueOrigens = useMemo(() => [...new Set(listings.map(l => l.origen))], []);
  
  useEffect(() => {
    const minFromUrl = searchParams.get('minArea');
    const maxFromUrl = searchParams.get('maxArea');
    const newMin = minFromUrl ? Number(minFromUrl) : minArea;
    const newMax = maxFromUrl ? Number(maxFromUrl) : maxArea;
    setAreaInput([String(newMin), String(newMax)]);
    setSliderValue([newMin, newMax]);
  }, [searchParams, minArea, maxArea]);

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(paramsToUpdate)) {
        if (value === null || value === 'todos') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleFilterChange = (name: string, value: string) => {
    router.push(`${pathname}?${createQueryString({ [name]: value })}`, { scroll: false });
  };
  
  const handleRemoveFilter = (key: string) => {
    const newParams: Record<string, null> = {};
    if (key === 'area') {
      newParams.minArea = null;
      newParams.maxArea = null;
    } else {
      newParams[key] = null;
    }
    router.push(`${pathname}?${createQueryString(newParams)}`, { scroll: false });
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
      router.push(`${pathname}?${createQueryString({ minArea: String(newMin), maxArea: String(newMax) })}`, { scroll: false });
    }
  };
  
  const handleSliderVisualChange = (newRange: [number, number]) => {
    setSliderValue(newRange);
    setAreaInput([String(newRange[0]), String(newRange[1])])
  };
  
  const handleSliderFilterCommit = (newRange: [number, number]) => {
     router.push(`${pathname}?${createQueryString({ minArea: String(newRange[0]), maxArea: String(newRange[1]) })}`, { scroll: false });
  };


  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const agentMatch = !agentFilter || listing.agent.name === agentFilter;
      const neighborhoodMatch = !neighborhoodFilter || listing.neighborhood === neighborhoodFilter;
      const areaMatch = listing.area >= minAreaFilter && listing.area <= maxAreaFilter;
      const statusMatch = !statusFilter || listing.status === statusFilter;
      const origenMatch = !origenFilter || listing.origen === origenFilter;
      return agentMatch && neighborhoodMatch && areaMatch && statusMatch && origenMatch;
    });
  }, [agentFilter, neighborhoodFilter, minAreaFilter, maxAreaFilter, statusFilter, origenFilter]);

  const activeFilters: { type: string; value: string; key: string }[] = [];
  if (agentFilter) activeFilters.push({ type: 'Agente', value: agentFilter, key: 'agent' });
  if (neighborhoodFilter) activeFilters.push({ type: 'Barrio', value: neighborhoodFilter, key: 'neighborhood' });
  if (origenFilter) activeFilters.push({ type: 'Origen', value: origenFilter, key: 'origen' });
  if (statusFilter) activeFilters.push({ type: 'Estado', value: statusFilter, key: 'status' });
  if (searchParams.has('minArea') || searchParams.has('maxArea')) {
      activeFilters.push({
          type: 'M²',
          value: `${minAreaFilter} - ${maxAreaFilter}`,
          key: 'area'
      });
  }

  
  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Lotes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Origen</Label>
              <Select onValueChange={(value) => handleFilterChange('origen', value)} defaultValue={searchParams.get('origen') || 'todos'}>
                <SelectTrigger>
                  <SelectValue placeholder="Origenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Origenes</SelectItem>
                  {uniqueOrigens.map((origen) => (
                    <SelectItem key={origen} value={origen}>
                      {origen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select onValueChange={(value) => handleFilterChange('status', value)} defaultValue={searchParams.get('status') || 'todos'}>
                <SelectTrigger>
                  <SelectValue placeholder="Estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Estados</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barrio</Label>
              <Select onValueChange={(value) => handleFilterChange('neighborhood', value)} defaultValue={searchParams.get('neighborhood') || 'todos'}>
                <SelectTrigger>
                  <SelectValue placeholder="Barrios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Barrios</SelectItem>
                  {uniqueNeighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agente</Label>
              <Select onValueChange={(value) => handleFilterChange('agent', value)} defaultValue={searchParams.get('agent') || 'todos'}>
                <SelectTrigger>
                  <SelectValue placeholder="Agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Agentes</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.email} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label>M² Estimados: {minAreaFilter} - {maxAreaFilter}m²</Label>
              <div className="flex gap-2">
                 <Input
                  type="number"
                  placeholder="Min"
                  value={areaInput[0]}
                  min={minArea}
                  max={maxArea}
                  onChange={(e) => handleAreaInputChange(0, e.target.value)}
                  onBlur={handleAreaInputBlur}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={areaInput[1]}
                  min={minArea}
                  max={maxArea}
                  onChange={(e) => handleAreaInputChange(1, e.target.value)}
                  onBlur={handleAreaInputBlur}
                />
              </div>
              <Slider 
                value={sliderValue}
                onValueChange={handleSliderVisualChange}
                onValueCommit={handleSliderFilterCommit}
                min={minArea}
                max={maxArea}
                step={10}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2 pt-4 border-t">
            <Label className="font-semibold">Filtros Activos:</Label>
            {activeFilters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map(filter => (
                        <Badge key={filter.key} variant="secondary" className="flex items-center gap-1.5 pl-2">
                            <span>{filter.type}: {filter.value}</span>
                            <button onClick={() => handleRemoveFilter(filter.key)} className="rounded-full p-0.5 text-muted-foreground hover:bg-background/50 hover:text-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Ningún filtro aplicado.</p>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Lotes</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="SMP o Dirección" className="pl-8" />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lote
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredListings.map((listing) => (
            <Link href={`/lotes/${listing.smp}`} key={listing.smp} className="block">
              <ListingCard listing={listing} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
