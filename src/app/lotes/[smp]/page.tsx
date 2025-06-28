
"use client"

import * as React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from 'next/navigation'
import { format } from "date-fns"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

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
import { ArrowLeft, MapPin, Scan, Ruler, Edit, Download, Upload, Library, FileText, User, Home, Mailbox, Building, Phone, Smartphone, Mail, Info, XCircle, Scaling, Percent, CreditCard, DollarSign, MessageSquare, Calendar } from "lucide-react"
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
import { listings, getStatusStyles } from "@/lib/data";

const PdfContent = React.forwardRef<
  HTMLDivElement,
  { listing: (typeof listings)[0]; imageUrl: string | null | undefined }
>(({ listing, imageUrl }, ref) => {
  const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px', color: '#2D3746' };
  const fieldStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' };
  const labelStyle: React.CSSProperties = { fontWeight: 'bold', color: '#555' };
  const valueStyle: React.CSSProperties = { color: '#333', textAlign: 'right' };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' };

  return (
    <div ref={ref} style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#333', padding: '40px', background: 'white', width: '210mm' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2D3746', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Ficha de Lote</h1>
        <h2 style={{ fontSize: '18px', fontWeight: 'normal', margin: '4px 0' }}>{listing.address} - {listing.neighborhood}</h2>
      </div>

      {imageUrl && <img src={imageUrl} crossOrigin="anonymous" style={{ width: '100%', height: '250px', marginBottom: '20px', borderRadius: '4px', objectFit: 'cover' }} alt={listing.address} />}
      
      <div style={gridStyle}>
        <div>
          <h3 style={sectionTitleStyle}>Información Urbanística</h3>
          <div style={fieldStyle}><span style={labelStyle}>SMP:</span> <span style={valueStyle}>{listing.smp}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Código Urbanístico:</span> <span style={valueStyle}>{listing.codigoUrbanistico}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>CPU:</span> <span style={valueStyle}>{listing.cpu}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Partida:</span> <span style={valueStyle}>{listing.partida}</span></div>
        </div>
        <div>
          <h3 style={sectionTitleStyle}>Catastral</h3>
          <div style={fieldStyle}><span style={labelStyle}>M² Estimados:</span> <span style={valueStyle}>{listing.area} m²</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Incidencia UVA:</span> <span style={valueStyle}>{listing.incidenciaUVA}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>FOT:</span> <span style={valueStyle}>{listing.fot}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Alícuota:</span> <span style={valueStyle}>{listing.alicuota}%</span></div>
        </div>
      </div>
      
      <h3 style={sectionTitleStyle}>Datos de Tasación</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>M2 Vendibles:</span> <span style={valueStyle}>{listing.m2Vendibles} m²</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Valor de Venta (USD):</span> <span style={valueStyle}>$ {listing.valorVentaUSD.toLocaleString('es-AR')}</span></div>
        </div>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>Incidencia Tasada (USD/m2):</span> <span style={valueStyle}>$ {listing.incidenciaTasadaUSD.toLocaleString('es-AR')}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Forma de Pago:</span> <span style={valueStyle}>{listing.formaDePago}</span></div>
        </div>
      </div>
      {listing.saleDate && (
        <div style={fieldStyle}><span style={labelStyle}>Fecha de Venta:</span> <span style={valueStyle}>{format(new Date(listing.saleDate), "dd/MM/yyyy")}</span></div>
      )}

      <h3 style={sectionTitleStyle}>Información del Propietario</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>Propietario:</span> <span style={valueStyle}>Juan Pérez</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Dirección:</span> <span style={valueStyle}>Calle Falsa 123, Buenos Aires</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Email:</span> <span style={valueStyle}>juan.perez@example.com</span></div>
        </div>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>Fallecido:</span> <span style={valueStyle}>No</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Teléfono:</span> <span style={valueStyle}>(011) 4555-5555</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Celular:</span> <span style={valueStyle}>(011) 15-1234-5678</span></div>
        </div>
      </div>
    </div>
  );
});
PdfContent.displayName = 'PdfContent';

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
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleAddNote = () => {
      if (newNote.trim() === "" || !listing) return;
      
      const currentUser = listing.agent;

      setNotes([
        {
          text: newNote,
          user: currentUser.name,
          avatarUrl: "https://placehold.co/100x100.png", // This should be dynamic based on current user
          aiHint: "person", // This should be dynamic
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

  const handleGeneratePdf = async () => {
    if (!pdfContentRef.current || !listing) return;

    setIsGeneratingPdf(true);
    toast({
        title: "Generando PDF...",
        description: "Por favor, espera un momento.",
    });

    try {
        const canvas = await html2canvas(pdfContentRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let renderHeight = pdfHeight - 20; // with margin
        let renderWidth = renderHeight * canvasAspectRatio;

        if (renderWidth > pdfWidth - 20) {
            renderWidth = pdfWidth - 20;
            renderHeight = renderWidth / canvasAspectRatio;
        }

        const xOffset = (pdfWidth - renderWidth) / 2;
        const yOffset = 10;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
        pdf.save(`ficha-lote-${listing.smp}.pdf`);
        
        toast({
            title: "PDF Generado",
            description: `La ficha del lote ${listing.address} se ha descargado.`,
        });
    } catch (error) {
        console.error("Error al generar PDF:", error);
        toast({
            variant: "destructive",
            title: "Error al generar PDF",
            description: "No se pudo crear el archivo. Inténtalo de nuevo.",
        });
    } finally {
        setIsGeneratingPdf(false);
    }
  };

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
        <Link href={`/lotes/${listing.smp}/editar`}>
            <Button variant="default"><Edit className="mr-2 h-4 w-4"/> Editar lote</Button>
        </Link>
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
                             <AvatarImage src={"https://placehold.co/100x100.png"} data-ai-hint={"person"} />
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
                        <Button variant="default"><Edit className="mr-2 h-4 w-4"/> Editar foto</Button>
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
                <Button variant="secondary" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                  <Download className="mr-2 h-4 w-4"/> 
                  {isGeneratingPdf ? "Generando..." : "Descargar Ficha PDF"}
                </Button>
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
                      <div className="flex items-center">
                        <Scaling className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Incidencia UVA:</span>
                        <span className="ml-auto text-muted-foreground">{listing.incidenciaUVA}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">FOT:</span>
                        <span className="ml-auto text-muted-foreground">{listing.fot}</span>
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
                      <div className="flex items-center">
                        <Percent className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="font-medium">Alícuota:</span>
                        <span className="ml-auto text-muted-foreground">{listing.alicuota}%</span>
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
                      <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">M2 Vendibles:</span>
                      <span className="ml-auto text-muted-foreground">{listing.m2Vendibles} m²</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Valor de Venta (USD):</span>
                      <span className="ml-auto text-muted-foreground">$ {listing.valorVentaUSD.toLocaleString('es-AR')}</span>
                    </div>
                     <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Forma de Pago:</span>
                      <span className="ml-auto text-muted-foreground">{listing.formaDePago}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Incidencia Tasada (USD/m2):</span>
                      <span className="ml-auto text-muted-foreground">$ {listing.incidenciaTasadaUSD.toLocaleString('es-AR')}</span>
                    </div>
                     <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Fecha de Venta:</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.saleDate ? format(new Date(listing.saleDate), "dd/MM/yyyy") : "N/A"}
                      </span>
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
                                <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="person" />
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
      <div className="hidden">
        <div ref={pdfContentRef}>
          {listing && <PdfContent listing={listing} imageUrl={currentImageUrl} />}
        </div>
      </div>
    </div>
  );
}
