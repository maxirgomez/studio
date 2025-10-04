import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Scan, Ruler } from "lucide-react";
import { getStatusStyles } from "@/lib/data";

export interface Listing {
  address: string;
  neighborhood: string;
  smp: string;
  area: number;
  status: string;
  agent: {
    user: string;
    nombre: string | null;
    apellido: string | null;
    foto_perfil: string | null;
    initials: string;
  };
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

// Función para convertir nombres de barrios sin acentos a con acentos
function formatBarrioName(barrio: string): string {
  const barrioMappings: { [key: string]: string } = {
    'GUEMES': 'GÜEMES',
    'guemes': 'güemes',
    'Guemes': 'Güemes',
    // Agregar más mapeos según sea necesario
  };
  
  return barrioMappings[barrio] || barrio;
}



const ListingCard = ({ listing }: ListingCardProps) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-0">
      <div className="relative">
        {listing.imageUrl ? (
          <SafeImage
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
                 <h3 className="font-semibold text-lg">
           {(() => {
             // Validar que listing.address existe y no es null
             if (!listing.address) {
               return 'Dirección no disponible';
             }
             
             // DEBUG: Mostrar el valor exacto que llega
             
             // Detectar si la dirección tiene formato "CALLE 1155.1157.1159..."
             const match = listing.address.match(/^(\D+)([\d.]+)$/);
             if (match) {
               const calle = formatBarrioName(match[1].trim());
               const numeros = match[2].split('.');
               return (
                 <>
                   {calle + ' '}
                   {numeros.map((numero, idx) => (
                     <a
                       key={numero}
                       href={`/lotes/${listing.smp}/docs/${numero}`}
                       className="text-foreground hover:text-foreground/80"
                     >
                       {numero}
                       {idx < numeros.length - 1 ? ', ' : ''}
                     </a>
                   ))}
                 </>
               );
             }
             // Si no, mostrar la dirección tal cual pero formateando el barrio
             return formatBarrioName(listing.address);
           })()}
         </h3>
                 <div className="flex items-center text-sm text-muted-foreground">
           <MapPin className="h-4 w-4 mr-2" />
           <span>{formatBarrioName(listing.neighborhood) || 'Barrio no disponible'}</span>
         </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Scan className="h-4 w-4 mr-2" />
          <span>SMP: {listing.smp || 'No disponible'}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Ruler className="h-4 w-4 mr-2" />
          <span>{listing.area ? `${listing.area} m² estimados` : 'Área no disponible'}</span>
        </div>
      </div>
    </CardContent>
    <CardFooter className="bg-card p-4 flex justify-between items-center">
        <Badge 
          style={{
            ...getStatusStyles(listing.status || 'Sin estado'),
            borderColor: 'transparent'
          }}
        >
          {listing.status || 'Sin estado'}
        </Badge>
        <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
                <AvatarImage src={listing.agent?.foto_perfil || ''} alt={`Foto de ${listing.agent?.nombre} ${listing.agent?.apellido}`} />
                <AvatarFallback>{listing.agent?.initials || 'NA'}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
  {listing.agent?.nombre && listing.agent?.apellido
    ? `${listing.agent.nombre} ${listing.agent.apellido}`
    : listing.agent?.user || 'Agente no disponible'}
</span>
        </div>
    </CardFooter>
  </Card>
);

export default ListingCard; 