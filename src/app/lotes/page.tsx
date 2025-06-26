
"use client";

import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from 'next/navigation';
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


const listings = [
  {
    address: "Av. Santa Fe 1060",
    neighborhood: "Palermo",
    smp: "017-027-020A",
    area: 110,
    status: "Tomar Acción",
    agent: { name: "Admin User", initials: "AU" },
    imageUrl: null,
  },
  {
    address: "Juramento 1196",
    neighborhood: "Belgrano",
    smp: "017-059-048D",
    area: 162,
    status: "Tasación",
    agent: { name: "John Doe", initials: "JD" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern apartment building"
  },
  {
    address: "Rivadavia 1298",
    neighborhood: "Caballito",
    smp: "017-027-006",
    area: 185,
    status: "Evolucionando",
    agent: { name: "Alice Smith", initials: "AS" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "storefront supermarket"
  },
  {
    address: "Corrientes 1341",
    neighborhood: "Almagro",
    smp: "031-036-034",
    area: 174,
    status: "Disponible",
    agent: { name: "Ricardo Gonzalez", initials: "RG" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "industrial warehouse"
  },
  {
    address: "Scalabrini Ortiz 1494",
    neighborhood: "Recoleta",
    smp: "017-026-022",
    area: 210,
    status: "Recicleta",
    agent: { name: "Admin User", initials: "AU" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "old city building"
  },
  {
    address: "Quintana 1577",
    neighborhood: "San Telmo",
    smp: "031-053-037",
    area: 150,
    status: "Tasación",
    agent: { name: "John Doe", initials: "JD" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "yellow historic house"
  },
  {
    address: "Defensa 1684",
    neighborhood: "Villa Crespo",
    smp: "031-055-029",
    area: 195,
    status: "Evolucionando",
    agent: { name: "Alice Smith", initials: "AS" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "suburban brick house"
  },
  {
    address: "Login Exitoso",
    neighborhood: "Bienvenido, Admin!",
    smp: "031-114-032",
    area: 95,
    status: "Disponible",
    agent: { name: "Ricardo Gonzalez", initials: "RG" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "red modern house"
  },
  {
    address: "Another Listing 1",
    neighborhood: "Palermo",
    smp: "017-027-021A",
    area: 120,
    status: "Tomar Acción",
    agent: { name: "Admin User", initials: "AU" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern house"
  },
  {
    address: "Another Listing 2",
    neighborhood: "Belgrano",
    smp: "017-059-049D",
    area: 170,
    status: "Tasación",
    agent: { name: "John Doe", initials: "JD" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "luxury apartment"
  },
];

const ListingCard = ({ listing }: { listing: (typeof listings)[0] }) => (
  <Card className="overflow-hidden">
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
        <Badge variant={listing.status === "Disponible" ? "default" : "secondary"}>{listing.status}</Badge>
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
  const searchParams = useSearchParams();
  const agentFilter = searchParams.get('agent');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredListings = agentFilter
    ? listings.filter(listing => listing.agent.name === agentFilter)
    : listings;

  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentListings = filteredListings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
                  <SelectItem value="origen1">Origen 1</SelectItem>
                  <SelectItem value="origen2">Origen 2</SelectItem>
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
                  <SelectItem value="estado1">Estado 1</SelectItem>
                  <SelectItem value="estado2">Estado 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barrio</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Barrios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barrio1">Barrio 1</SelectItem>
                  <SelectItem value="barrio2">Barrio 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agente</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agente1">Agente 1</SelectItem>
                  <SelectItem value="agente2">Agente 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label>M² Estimados:</Label>
              <div className="flex gap-2">
                <Input placeholder="Min." />
                <Input placeholder="Máx." />
              </div>
              <Slider defaultValue={[0]} max={1000} step={10} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{agentFilter ? `Lotes de ${agentFilter}` : "Lotes"}</h2>
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
            <ListingCard key={listing.smp} listing={listing} />
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
