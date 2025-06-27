
"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from 'next/navigation'
import { format } from "date-fns"

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
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Scan, Ruler, Edit, Download, Upload, Library, FileText, User, Home, Mailbox, Building, Phone, Smartphone, Mail, Info, XCircle, Scaling, Percent, CreditCard, DollarSign, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

// Data duplicated for now. Ideally, this would be in a shared file.
const listings = [
  {
    address: "Av. Santa Fe 1060",
    neighborhood: "Palermo",
    smp: "017-027-020A",
    area: 110,
    status: "Tomar Acción",
    agent: { name: "Ariel Naem", initials: "AN", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man with glasses" },
    imageUrl: null,
    origen: "Tor",
    codigoUrbanistico: "U.S.A.M.",
    cpu: "R2b1",
    partida: "123456-7",
  },
  {
    address: "Juramento 1196",
    neighborhood: "Belgrano",
    smp: "017-059-048D",
    area: 162,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man professional" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern apartment building",
    origen: "Baigun Realty",
    codigoUrbanistico: "C.M.",
    cpu: "R1a",
    partida: "234567-8",
  },
  {
    address: "Rivadavia 1298",
    neighborhood: "Caballito",
    smp: "017-027-006",
    area: 185,
    status: "Evolucionando",
    agent: { name: "Iair Baredes", initials: "IB", avatarUrl: "https://placehold.co/100x100.png", aiHint: "storefront supermarket" },
    origen: "Producción",
    codigoUrbanistico: "U.S.A.A.",
    cpu: "C3II",
    partida: "345678-9",
  },
  {
    address: "Corrientes 1341",
    neighborhood: "Almagro",
    smp: "031-036-034",
    area: 174,
    status: "Disponible",
    agent: { name: "Martín Beorlegui", initials: "MB", avatarUrl: "https://placehold.co/100x100.png", aiHint: "industrial warehouse" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "industrial warehouse",
    origen: "Tor",
    codigoUrbanistico: "C.M.",
    cpu: "C1",
    partida: "456789-0",
  },
  {
    address: "Scalabrini Ortiz 1494",
    neighborhood: "Recoleta",
    smp: "017-026-022",
    area: 210,
    status: "Descartado",
    agent: { name: "Ariel Naem", initials: "AN", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man with glasses" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "old city building",
    origen: "Baigun Realty",
    codigoUrbanistico: "A.E.",
    cpu: "R1b",
    partida: "567890-1",
  },
  {
    address: "Quintana 1577",
    neighborhood: "San Telmo",
    smp: "031-053-037",
    area: 150,
    status: "No vende",
    agent: { name: "Matías Poczter", initials: "MP", avatarUrl: "https://placehold.co/100x100.png", aiHint: "person smiling" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "yellow historic house",
    origen: "Producción",
    codigoUrbanistico: "A.P.H.",
    cpu: "APH1",
    partida: "678901-2",
  },
  {
    address: "Defensa 1684",
    neighborhood: "Villa Crespo",
    smp: "031-055-029",
    area: 195,
    status: "Reservado",
    agent: { name: "Matias Chirom", initials: "MC", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man office" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "suburban brick house",
    origen: "Tor",
    codigoUrbanistico: "U.S.A.B.2",
    cpu: "R2bII",
    partida: "789012-3",
  },
  {
    address: "Login Exitoso",
    neighborhood: "Bienvenido, Admin!",
    smp: "031-114-032",
    area: 95,
    status: "Vendido",
    agent: { name: "Maria Bailo Newton", initials: "MN", avatarUrl: "https://placehold.co/100x100.png", aiHint: "woman professional" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "red modern house",
    origen: "Baigun Realty",
    codigoUrbanistico: "C.M.",
    cpu: "C3I",
    partida: "890123-4",
  },
  {
    address: "Another Listing 1",
    neighborhood: "Palermo",
    smp: "017-027-021A",
    area: 120,
    status: "Tomar Acción",
    agent: { name: "Roxana Rajich", initials: "RR", avatarUrl: "https://placehold.co/100x100.png", aiHint: "woman smiling" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "modern house",
    origen: "Producción",
    codigoUrbanistico: "U.S.A.M.",
    cpu: "R2b1",
    partida: "901234-5",
  },
  {
    address: "Another Listing 2",
    neighborhood: "Belgrano",
    smp: "017-059-049D",
    area: 170,
    status: "Tasación",
    agent: { name: "Santiago Liscovsky", initials: "SL", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man professional" },
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "luxury apartment",
    origen: "Tor",
    codigoUrbanistico: "C.M.",
    cpu: "R1a",
    partida: "012345-6",
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


export default function LoteDetailPage() {
  const params = useParams<{ smp: string }>();
  const listing = listings.find((l) => l.smp === params.smp);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(listing?.imageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [notes, setNotes] = useState([
    {
      text: "Se contactó al propietario, mostró interés en vender pero no está apurado.",
      user: "Ariel Naem",
      avatarUrl: "https://placehold.co/100x100.png",
      aiHint: "man with glasses",
      initials: "AN",
      timestamp: new Date('2024-07-20T10:30:00'),
    },
    {
      text: "Llamada de seguimiento. El propietario pidió que lo contactemos en 2 semanas.",
      user: "Ariel Naem",
      avatarUrl: "https://placehold.co/100x100.png",
      aiHint: "man with glasses",
      initials: "AN",
      timestamp: new Date('2024-07-22T15:00:00'),
    },
  ]);
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
      if (newNote.trim() === "" || !listing) return;
      
      const currentUser = listing.agent;

      setNotes([
        {
          text: newNote,
          user: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          aiHint: currentUser.aiHint,
          initials: currentUser.initials,
          timestamp: new Date(),
        },
        ...notes
      ]);
      setNewNote("");
      toast({
        title: "Nota Agregada",
        description: "Tu nota ha sido guardada en el seguimiento del lote.",
      })
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = () => {
    if (previewUrl && selectedFile) {
      setCurrentImageUrl(previewUrl);
      toast({
        title: "Foto Actualizada",
        description: `La foto para el lote ${listing?.address} ha sido actualizada.`,
      });
      setIsEditDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const onDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
    setIsEditDialogOpen(open);
  }


  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold">Lote no encontrado</h1>
        <p className="text-muted-foreground mt-2">
          El lote con SMP "{params.smp}" no pudo ser encontrado.
        </p>
        <Link href="/lotes">
          <Button>Volver a Lotes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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
        <Button><Edit className="mr-2 h-4 w-4"/> Editar lote</Button>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-1">
            <Card>
                <CardContent className="p-0">
                {currentImageUrl ? (
                    <Image
                        src={currentImageUrl}
                        alt={listing.address}
                        width={600}
                        height={400}
                        className="aspect-video object-cover rounded-lg"
                        data-ai-hint={listing.aiHint}
                    />
                ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                        <p className="text-muted-foreground">Imagen no disponible</p>
                    </div>
                )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Estado y Agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Estado</span>
                        <Badge style={getStatusStyles(listing.status)}>{listing.status}</Badge>
                    </div>
                     <div className="flex items-center pt-2">
                        <Avatar className="h-10 w-10 mr-4">
                             <AvatarImage src={listing.agent.avatarUrl} data-ai-hint={listing.agent.aiHint} />
                            <AvatarFallback>{listing.agent.initials}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="font-medium">{listing.agent.name}</p>
                            <p className="text-sm text-muted-foreground">Agente a cargo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
                <Dialog open={isEditDialogOpen} onOpenChange={onDialogClose}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Edit className="mr-2 h-4 w-4"/> Editar foto</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Foto del Lote</DialogTitle>
                            <DialogDescription>
                                Selecciona una nueva imagen para el lote. La imagen se actualizará al guardar los cambios.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="picture">Nueva Foto</Label>
                                <Input id="picture" type="file" onChange={handleFileChange} accept="image/*" />
                            </div>
                            {(previewUrl || currentImageUrl) && (
                              <div className="mt-4">
                                <p className="text-sm font-medium mb-2">Vista Previa:</p>
                                <Image 
                                  src={previewUrl || currentImageUrl!} 
                                  alt="Vista previa de la imagen"
                                  width={400}
                                  height={300}
                                  className="rounded-md object-cover aspect-video"
                                />
                              </div>
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </DialogClose>
                            <Button type="button" onClick={handleSaveChanges} disabled={!selectedFile}>
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="secondary"><Download className="mr-2 h-4 w-4"/> Descargar Ficha PDF</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Informes adjuntos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Seleccionar PDF
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Información Urbanística y Catastral</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Scan className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">SMP:</span>
                        <span className="ml-auto text-muted-foreground">{listing.smp}</span>
                      </div>
                      <div className="flex items-center">
                        <Library className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Código Urbanístico:</span>
                        <span className="ml-auto text-muted-foreground">{listing.codigoUrbanistico}</span>
                      </div>
                      <div className="flex items-center">
                        <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">M2 Estimados:</span>
                        <span className="ml-auto text-muted-foreground">{listing.area} m²</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Barrio:</span>
                        <span className="ml-auto text-muted-foreground">{listing.neighborhood}</span>
                      </div>
                       <div className="flex items-center">
                        <Building className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">CPU:</span>
                        <span className="ml-auto text-muted-foreground">{listing.cpu}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Partida:</span>
                        <span className="ml-auto text-muted-foreground">{listing.partida}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Información del propietario</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center">
                          <User className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Propietario:</span>
                          <span className="ml-auto text-muted-foreground">Juan Pérez</span>
                      </div>
                      <div className="flex items-center">
                          <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Direccion Contacto:</span>
                          <span className="ml-auto text-muted-foreground">Calle Falsa 123</span>
                      </div>
                      <div className="flex items-center">
                          <Mailbox className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Codigo Postal:</span>
                          <span className="ml-auto text-muted-foreground">C1425</span>
                      </div>
                      <div className="flex items-center">
                          <Building className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Localidad:</span>
                          <span className="ml-auto text-muted-foreground">Buenos Aires</span>
                      </div>
                      <div className="flex items-center">
                          <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Direccion Alternativa:</span>
                          <span className="ml-auto text-muted-foreground">Av. Siempreviva 742</span>
                      </div>
                      <div className="flex items-center">
                          <XCircle className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Fallecido:</span>
                          <span className="ml-auto text-muted-foreground">No</span>
                      </div>
                       <div className="flex items-center">
                          <Info className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Otros Datos:</span>
                          <span className="ml-auto text-muted-foreground">Contactar solo por la mañana.</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Teléfono 1:</span>
                          <span className="ml-auto text-muted-foreground">(011) 4555-5555</span>
                      </div>
                      <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Teléfono 2:</span>
                          <span className="ml-auto text-muted-foreground">(011) 4666-6666</span>
                      </div>
                      <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Teléfono 3:</span>
                          <span className="ml-auto text-muted-foreground">-</span>
                      </div>
                      <div className="flex items-center">
                          <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Celular 1:</span>
                          <span className="ml-auto text-muted-foreground">(011) 15-1234-5678</span>
                      </div>
                      <div className="flex items-center">
                          <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Celular 2:</span>
                          <span className="ml-auto text-muted-foreground">-</span>
                      </div>
                      <div className="flex items-center">
                          <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Celular 3:</span>
                          <span className="ml-auto text-muted-foreground">-</span>
                      </div>
                      <div className="flex items-center">
                          <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Correo Electrónico:</span>
                          <span className="ml-auto text-muted-foreground truncate">juan.perez@example.com</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos de Tasación</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Scaling className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Incidencia UVA:</span>
                      <span className="ml-auto text-muted-foreground">1.25</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">FOT:</span>
                      <span className="ml-auto text-muted-foreground">3.0</span>
                    </div>
                    <div className="flex items-center">
                      <Percent className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Alícuota:</span>
                      <span className="ml-auto text-muted-foreground">8.25%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">M2 Vendibles:</span>
                      <span className="ml-auto text-muted-foreground">555 m²</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Valor de Venta (USD):</span>
                      <span className="ml-auto text-muted-foreground">$ 1,200,000</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Incidencia Tasada (USD/m2):</span>
                      <span className="ml-auto text-muted-foreground">$ 2,162</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Forma de Pago:</span>
                      <span className="ml-auto text-muted-foreground">A convenir</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Seguimiento del Lote</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <Avatar>
                                <AvatarImage src={listing.agent.avatarUrl} data-ai-hint={listing.agent.aiHint} />
                                <AvatarFallback>{listing.agent.initials}</AvatarFallback>
                            </Avatar>
                            <div className="w-full space-y-2">
                                <Textarea
                                    placeholder="Escribe una nueva nota de seguimiento..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Agregar Nota
                                </Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            {notes.map((note, index) => (
                                <div key={index} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={note.avatarUrl} data-ai-hint={note.aiHint} />
                                        <AvatarFallback>{note.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{note.user}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(note.timestamp, "dd/MM/yyyy HH:mm")}
                                            </p>
                                        </div>
                                        <p className="text-base text-muted-foreground">{note.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    

    
