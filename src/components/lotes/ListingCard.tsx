import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Scan, Ruler } from "lucide-react";
import { getStatusStyles } from "@/lib/data";

export interface Listing {
  address: string;
  neighborhood: string;
  smp: string;
  area: number;
  status: string;
  agent: { name: string; initials: string };
  imageUrl: string | null;
  aiHint?: string;
  origen: string;
  codigoUrbanistico: string;
  cpu: string;
  partida: string;
  valorVentaUSD: number;
  listingDate: Date;
  saleDate: Date | null;
  incidenciaUVA: number;
  fot: number;
  alicuota: number;
  m2Vendibles: number;
  incidenciaTasadaUSD: number;
  formaDePago: string;
}

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => (
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

export default ListingCard; 