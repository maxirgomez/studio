import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Scan, Ruler, Edit, MessageSquare, Files } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Data duplicated for now. Ideally, this would be in a shared file.
const listings = [
  {
    address: "Av. Santa Fe 1060",
    neighborhood: "Palermo",
    smp: "017-027-020A",
    area: 110,
    status: "Tomar Acción",
    agent: { name: "Roxana Rajich", initials: "RR" },
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


export default function LoteDetailPage({ params }: { params: { smp: string } }) {
  const listing = listings.find((l) => l.smp === params.smp);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold">Lote no encontrado</h1>
        <p className="text-muted-foreground mt-2">
          El lote con SMP "{params.smp}" no pudo ser encontrado.
        </p>
        <Link href="/lotes" className="mt-6">
          <Button>Volver a Lotes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lotes">
            <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{listing.address}</h1>
            <p className="text-muted-foreground">{listing.neighborhood}</p>
        </div>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardContent className="p-0">
                {listing.imageUrl ? (
                    <Image
                        src={listing.imageUrl}
                        alt={listing.address}
                        width={1200}
                        height={800}
                        className="aspect-video object-cover rounded-t-lg"
                        data-ai-hint={listing.aiHint}
                    />
                ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                        <p className="text-muted-foreground">Imagen no disponible</p>
                    </div>
                )}
                </CardContent>
            </Card>

            <Tabs defaultValue="detalles" className="w-full">
              <TabsList>
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="analisis">Análisis</TabsTrigger>
                <TabsTrigger value="archivos">Archivos</TabsTrigger>
              </TabsList>
              <TabsContent value="detalles" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Lote</CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Dirección:</span>
                        <span className="ml-auto text-muted-foreground">{listing.address}</span>
                      </div>
                       <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Barrio:</span>
                        <span className="ml-auto text-muted-foreground">{listing.neighborhood}</span>
                      </div>
                      <div className="flex items-center">
                        <Scan className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">SMP:</span>
                        <span className="ml-auto text-muted-foreground">{listing.smp}</span>
                      </div>
                      <div className="flex items-center">
                        <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Superficie:</span>
                        <span className="ml-auto text-muted-foreground">{listing.area} m²</span>
                      </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="analisis" className="mt-4">
                <Card>
                   <CardContent className="p-6">
                    <p className="text-muted-foreground">Análisis de la propiedad y viabilidad del proyecto se mostrarán aquí.</p>
                   </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="archivos" className="mt-4">
                <Card>
                   <CardContent className="p-6">
                    <p className="text-muted-foreground">Documentos y archivos relacionados con el lote se mostrarán aquí.</p>
                   </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

        </div>
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Estado y Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Estado</span>
                        <Badge style={getStatusStyles(listing.status)}>{listing.status}</Badge>
                    </div>
                     <div className="flex items-center pt-2">
                        <Avatar className="h-10 w-10 mr-4">
                             <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person" />
                            <AvatarFallback>{listing.agent.initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="font-medium">{listing.agent.name}</p>
                            <p className="text-sm text-muted-foreground">Agente a cargo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button><Edit className="mr-2 h-4 w-4"/> Editar Lote</Button>
                <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4"/> Ver Comentarios</Button>
                <Button variant="outline"><Files className="mr-2 h-4 w-4"/> Gestionar Archivos</Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
