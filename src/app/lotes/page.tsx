
"use client";

import Image from "next/image";
import * as React from "react";
import { useState } from "react";
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
} from "lucide-react";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext 
} from "@/components/ui/pagination";


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
  },
  {
    address: "Juramento 1196",
    neighborhood: "Belgrano",
    smp: "017-059-048D",
    area: 162,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern apartment building"
  },
  {
    address: "Rivadavia 1298",
    neighborhood: "Caballito",
    smp: "017-027-006",
    area: 185,
    status: "Evolucionando",
    agent: { name: "Iair Baredes", initials: "IB" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "storefront supermarket"
  },
  {
    address: "Corrientes 1341",
    neighborhood: "Almagro",
    smp: "031-036-034",
    area: 174,
    status: "Disponible",
    agent: { name: "Martín Beorlegui", initials: "MB" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "industrial warehouse"
  },
  {
    address: "Scalabrini Ortiz 1494",
    neighborhood: "Recoleta",
    smp: "017-026-022",
    area: 210,
    status: "Descartado",
    agent: { name: "Ariel Naem", initials: "AN" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "old city building"
  },
  {
    address: "Quintana 1577",
    neighborhood: "San Telmo",
    smp: "031-053-037",
    area: 150,
    status: "No vende",
    agent: { name: "Matías Poczter", initials: "MP" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "yellow historic house"
  },
  {
    address: "Defensa 1684",
    neighborhood: "Villa Crespo",
    smp: "031-055-029",
    area: 195,
    status: "Reservado",
    agent: { name: "Matias Chirom", initials: "MC" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "suburban brick house"
  },
  {
    address: "Login Exitoso",
    neighborhood: "Bienvenido, Admin!",
    smp: "031-114-032",
    area: 95,
    status: "Vendido",
    agent: { name: "Maria Bailo Newton", initials: "MN" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "red modern house"
  },
  {
    address: "Another Listing 1",
    neighborhood: "Palermo",
    smp: "017-027-021A",
    area: 120,
    status: "Tomar Acción",
    agent: { name: "Roxana Rajich", initials: "RR" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern house"
  },
  {
    address: "Another Listing 2",
    neighborhood: "Belgrano",
    smp: "017-059-049D",
    area: 170,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "luxury apartment"
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
  const agentFilter = searchParams.get('agent');
  const neighborhoodFilter = searchParams.get('neighborhood');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const uniqueNeighborhoods = [...new Set(listings.map(l => l.neighborhood))];
  const allAreas = listings.map(l => l.area);
  const minArea = Math.min(...allAreas);
  const maxArea = Math.max(...allAreas);
  const [areaRange, setAreaRange] = useState<[number, number]>([minArea, maxArea]);

  const filteredListings = listings.filter(listing => {
    const agentMatch = !agentFilter || listing.agent.name === agentFilter;
    const neighborhoodMatch = !neighborhoodFilter || listing.neighborhood === neighborhoodFilter;
    const areaMatch = listing.area >= areaRange[0] && listing.area <= areaRange[1];
    return agentMatch && neighborhoodMatch && areaMatch;
  });

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'todos') {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    router.replace(`${pathname}?${params.toString()}`);
    setCurrentPage(1);
  }

  let title = "Lotes";
  if (agentFilter) {
    title = `Lotes de ${agentFilter}`;
    if (neighborhoodFilter) {
      title += ` en ${neighborhoodFilter}`;
    }
  } else if (neighborhoodFilter) {
    title = `Lotes en ${neighborhoodFilter}`;
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Origenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tor">Tor</SelectItem>
                  <SelectItem value="baigun-realty">Baigun Realty</SelectItem>
                  <SelectItem value="produccion">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tomar-accion">Tomar acción</SelectItem>
                  <SelectItem value="tasacion">Tasación</SelectItem>
                  <SelectItem value="evolucionando">Evolucionando</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                  <SelectItem value="no-vende">No vende</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barrio</Label>
              <Select onValueChange={(value) => handleFilterChange('neighborhood', value)} defaultValue={neighborhoodFilter || 'todos'}>
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
              <Select onValueChange={(value) => handleFilterChange('agent', value)} defaultValue={agentFilter || 'todos'}>
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
              <Label>M² Estimados: {areaRange[0]} - {areaRange[1]}m²</Label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  value={areaRange[0]}
                  onChange={(e) => {
                      const newMin = Number(e.target.value);
                      if (newMin <= areaRange[1]) {
                          setAreaRange([newMin, areaRange[1]]);
                      }
                  }} 
                />
                <Input 
                  type="number"
                  value={areaRange[1]}
                  onChange={(e) => {
                      const newMax = Number(e.target.value);
                      if (newMax >= areaRange[0]) {
                          setAreaRange([areaRange[0], newMax]);
                      }
                  }}
                />
              </div>
              <Slider 
                value={areaRange}
                onValueChange={(value) => setAreaRange(value as [number, number])}
                min={minArea}
                max={maxArea}
                step={10}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
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
          {currentListings.map((listing) => (
            <Link href={`/lotes/${listing.smp}`} key={listing.smp} className="block">
              <ListingCard listing={listing} />
            </Link>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                 <PaginationItem>
                    <span className="p-2 text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                     className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        </div>
      </div>
    </div>
  );
}
