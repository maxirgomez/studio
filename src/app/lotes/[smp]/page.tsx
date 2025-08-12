"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from 'next/navigation'
import { format, parseISO } from "date-fns"
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
import { ArrowLeft, MapPin, Scan, Ruler, Edit, Download, Upload, Library, FileText, User, Home, Mailbox, Building, Phone, Smartphone, Mail, Info, XCircle, Scaling, Percent, CreditCard, DollarSign, MessageSquare, Calendar, CreditCard as CreditCardIcon } from "lucide-react"
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
import { getStatusStyles } from "@/lib/data";
import { useSpinner } from "@/components/ui/SpinnerProvider";
import { useUser } from "@/context/UserContext";
import { use } from "react";

// Función helper para mostrar "Sin información" cuando fallecido sea "No"
function formatFallecido(value: string | null | undefined): string {
  if (!value || value === "No") {
    return "Sin información";
  }
  return value;
}

const PdfContent = React.forwardRef<
  HTMLDivElement,
  { listing: any; imageUrl: string | null | undefined; agenteUsuario?: any; currentUser?: any }
>(({ listing, imageUrl, agenteUsuario, currentUser }, ref) => {
  const sectionTitleStyle: React.CSSProperties = { fontSize: '16px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px', color: '#2D3746' };
  const fieldStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px' };
  const labelStyle: React.CSSProperties = { fontWeight: 'bold', color: '#555' };
  const valueStyle: React.CSSProperties = { color: '#333', textAlign: 'right' };
  const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' };

  console.log('DEBUG PdfContent:', { agenteUsuario, agente: listing.agente });

  return (
    <div ref={ref} style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#333', padding: '40px', background: 'white', width: '210mm' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2D3746' }}>Baigun Realty</div>
        <h1 style={{ color: '#2D3746', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Ficha de Lote</h1>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0' }}>{listing.address}</h2>
        <p style={{ fontSize: '16px', fontWeight: 'normal', margin: '4px 0', color: '#555' }}>{listing.neighborhood}</p>
      </div>

      {imageUrl && <img src={imageUrl} crossOrigin="anonymous" style={{ width: '100%', height: 'auto', marginBottom: '20px', borderRadius: '4px' }} alt={listing.address} />}

      <h3 style={sectionTitleStyle}>Datos Principales</h3>
      <div style={gridStyle}>
        <div style={fieldStyle}><span style={labelStyle}>Estado:</span> <span style={valueStyle}>{listing.status}</span></div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Agente:</span>
          <span style={valueStyle}>{getAgenteNombre(agenteUsuario, listing.agente)}</span>
        </div>
        <div style={fieldStyle}><span style={labelStyle}>Origen:</span> <span style={valueStyle}>{listing.origen}</span></div>
        <div style={fieldStyle}><span style={labelStyle}>SMP:</span> <span style={valueStyle}>{listing.smp}</span></div>
      </div>

      <h3 style={sectionTitleStyle}>Información Urbanística y Catastral</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>Código Urbanístico:</span> <span style={valueStyle}>{listing.cur}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>CPU:</span> <span style={valueStyle}>{listing.cpu}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>FOT:</span> <span style={valueStyle}>{listing.fot}</span></div>
        </div>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>M² Estimados:</span> <span style={valueStyle}>{listing.area} m²</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Incidencia UVA:</span> <span style={valueStyle}>{listing.incidenciaUVA}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Alícuota:</span> <span style={valueStyle}>{listing.alicuota}%</span></div>
        </div>
      </div>
      <div style={{ ...fieldStyle, gridColumn: 'span 2' }}><span style={labelStyle}>Partida:</span> <span style={valueStyle}>{listing.partida}</span></div>


      <h3 style={sectionTitleStyle}>Datos de Tasación</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>M2 Vendibles:</span> <span style={valueStyle}>{listing.m2Vendibles} m²</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Valor de Venta (USD):</span> <span style={valueStyle}>{typeof listing.valorVentaUSD === "number" ? `$ ${listing.valorVentaUSD.toLocaleString('es-AR')}` : "N/A"}</span></div>
        </div>
        <div>
          <div style={fieldStyle}><span style={labelStyle}>Incidencia Tasada (USD/m2):</span> <span style={valueStyle}>{typeof listing.incidenciaTasadaUSD === "number" ? `$ ${listing.incidenciaTasadaUSD.toLocaleString('es-AR')}` : "N/A"}</span></div>
          <div style={fieldStyle}><span style={labelStyle}>Forma de Pago:</span> <span style={valueStyle}>{listing.formaDePago}</span></div>
        </div>
      </div>
      {listing.saleDate && (
        <div style={fieldStyle}><span style={labelStyle}>Fecha de Venta:</span> <span style={valueStyle}>{format(new Date(listing.saleDate), "dd/MM/yyyy")}</span></div>
      )}

      {canViewOwnerInfo(currentUser, listing) && (
        <>
          <h3 style={sectionTitleStyle}>Información del Propietario</h3>
          <div style={gridStyle}>
            <div>
              <div style={fieldStyle}><span style={labelStyle}>Propietario:</span> <span style={valueStyle}>{listing.propietario}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Dirección Contacto:</span> <span style={valueStyle}>{listing.direccion}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Localidad:</span> <span style={valueStyle}>{listing.localidad}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Dirección Alternativa:</span> <span style={valueStyle}>{listing.direccionalt}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Fallecido:</span> <span style={valueStyle}>{formatFallecido(listing.fallecido)}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Email:</span> <span style={valueStyle}>{listing.mail}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Cuit/Cuil:</span> <span style={valueStyle}>{formatCuitCuil(listing.cuitcuil)}</span></div>
            </div>
            <div>
              <div style={fieldStyle}><span style={labelStyle}>Teléfono 1:</span> <span style={valueStyle}>{listing.tel1}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Teléfono 2:</span> <span style={valueStyle}>{listing.tel2}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Teléfono 3:</span> <span style={valueStyle}>{listing.tel3}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Celular 1:</span> <span style={valueStyle}>{listing.cel1}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Celular 2:</span> <span style={valueStyle}>{listing.cel2}</span></div>
              <div style={fieldStyle}><span style={labelStyle}>Celular 3:</span> <span style={valueStyle}>{listing.cel3}</span></div>
            </div>
          </div>
        </>
      )}
      <div style={{ marginTop: '16px' }}>
        <h3 style={sectionTitleStyle}>Seguimiento/Notas del lote</h3>
        {listing.otros ? (
          <p style={{ fontSize: '12px', color: '#333' }}>{listing.otros}</p>
        ) : (
          <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>Sin comentarios adicionales</p>
        )}
      </div>
    </div>
  );
});
PdfContent.displayName = 'PdfContent';

function getAgenteNombre(agenteUsuario: any, agente: string) {
  if (agenteUsuario && agenteUsuario.nombre && agenteUsuario.apellido) {
    return `${agenteUsuario.nombre} ${agenteUsuario.apellido}`;
  }
  return agente || "-";
}

function formatCuitCuil(cuitcuil: any): string {
  if (!cuitcuil) return '';
  const str = String(cuitcuil).replace(/\.0+$/, ''); // Eliminar .0000000000
  if (/^\d{11}$/.test(str)) {
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
  }
  return str;
}

// Función helper para verificar si el usuario puede ver información del propietario
function canViewOwnerInfo(currentUser: any, listing: any): boolean {
  // Debug logs para entender qué está pasando
  console.log('DEBUG canViewOwnerInfo:', {
    currentUser: currentUser,
    currentUserRol: currentUser?.rol,
    currentUserUser: currentUser?.user,
    listing: listing,
    listingAgente: listing?.agente,
    listingAgentUser: listing?.agent?.user
  });

  // Solo los administradores tienen acceso total
  const isAdmin = currentUser?.rol === 'Administrador';
  console.log('DEBUG: ¿Es administrador?', isAdmin, 'Rol:', currentUser?.rol);

  if (isAdmin) {
    console.log('DEBUG: Usuario es Administrador, permitiendo acceso total');
    return true;
  }

  // El usuario asignado al lote también puede ver la información
  const agenteValue = listing?.agente;
  const currentUserValue = currentUser?.user;

  console.log('DEBUG: Comparando usuarios:', {
    currentUserValue: currentUserValue,
    agenteValue: agenteValue,
    currentUserValueLower: currentUserValue?.toLowerCase(),
    agenteValueLower: agenteValue?.toLowerCase(),
    areEqual: currentUserValue && agenteValue && currentUserValue.toLowerCase() === agenteValue.toLowerCase()
  });

  const isAssignedAgent = currentUserValue && agenteValue &&
    currentUserValue.toLowerCase() === agenteValue.toLowerCase();

  console.log('DEBUG: ¿Es el agente asignado?', isAssignedAgent);

  if (isAssignedAgent) {
    console.log('DEBUG: Usuario coincide con el agente asignado, permitiendo acceso');
    return true;
  }

  console.log('DEBUG: Usuario NO tiene permisos para ver información del propietario');
  return false;
}

// Función helper para verificar si el usuario puede editar el lote
function canEditLote(currentUser: any, listing: any): boolean {
  // Debug logs para entender qué está pasando
  console.log('DEBUG canEditLote:', {
    currentUser: currentUser,
    currentUserRol: currentUser?.rol,
    currentUserUser: currentUser?.user,
    listing: listing,
    listingAgente: listing?.agente
  });

  // Solo los administradores tienen acceso total
  const isAdmin = currentUser?.rol === 'Administrador';
  console.log('DEBUG: ¿Es administrador?', isAdmin, 'Rol:', currentUser?.rol);

  if (isAdmin) {
    console.log('DEBUG: Usuario es Administrador, permitiendo edición');
    return true;
  }

  // El usuario asignado al lote también puede editarlo
  const agenteValue = listing?.agente;
  const currentUserValue = currentUser?.user;

  console.log('DEBUG: Comparando usuarios para edición:', {
    currentUserValue: currentUserValue,
    agenteValue: agenteValue,
    currentUserValueLower: currentUserValue?.toLowerCase(),
    agenteValueLower: agenteValue?.toLowerCase(),
    areEqual: currentUserValue && agenteValue && currentUserValue.toLowerCase() === agenteValue.toLowerCase()
  });

  const isAssignedAgent = currentUserValue && agenteValue &&
    currentUserValue.toLowerCase() === agenteValue.toLowerCase();

  console.log('DEBUG: ¿Es el agente asignado?', isAssignedAgent);

  if (isAssignedAgent) {
    console.log('DEBUG: Usuario coincide con el agente asignado, permitiendo edición');
    return true;
  }

  console.log('DEBUG: Usuario NO tiene permisos para editar el lote');
  return false;
}

function formatDecimal(value: any) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (Number.isInteger(num)) return num;
  const str = String(value);
  const [, decimals] = str.split('.');
  if (decimals && decimals.replace(/0+$/, '').length > 2) {
    return num;
  }
  return num.toFixed(2).replace(/\.00$/, '');
}

export default function LoteDetailPage() {
  const params = useParams<{ smp: string }>();
  const { user: currentUser } = useUser();
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Detectar parámetro de dirección específica
  const [direccionEspecifica, setDireccionEspecifica] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(listing?.imageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { hide } = useSpinner();
  const [agenteUsuario, setAgenteUsuario] = useState<any | null>(null);

  // --- Archivos adjuntos ---
  const [docs, setDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detectar parámetro de dirección en la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const direccion = urlParams.get('direccion');
      setDireccionEspecifica(direccion);
    }
  }, []);

  useEffect(() => {
    async function fetchLote() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/lotes/${params.smp}`);
        if (res.status === 404) {
          setNotFound(true);
          setListing(null);
          setAgenteUsuario(null);
        } else {
          const data = await res.json();
          console.log('DEBUG Frontend recibió datos:', {
            lote: data.lote,
            agenteUsuario: data.agenteUsuario,
            loteAgente: data.lote?.agente,
            agenteUsuarioUser: data.agenteUsuario?.user,
            currentUser: currentUser
          });
          setListing(data.lote);
          setAgenteUsuario(data.agenteUsuario || null);
        }
      } catch (e) {
        setNotFound(true);
        setListing(null);
        setAgenteUsuario(null);
      }
      setLoading(false);
    }
    fetchLote();
  }, [params.smp, currentUser]);

  // Fetch notas reales
  useEffect(() => {
    async function fetchNotas() {
      setNotesLoading(true);
      try {
        const res = await fetch(`/api/lotes/${params.smp}/notas`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notas || []);
        } else {
          setNotes([]);
        }
      } catch {
        setNotes([]);
      }
      setNotesLoading(false);
    }
    fetchNotas();
  }, [params.smp]);

  // Fetch docs
  useEffect(() => {
    async function fetchDocs() {
      setDocsLoading(true);
      try {
        const res = await fetch(`/api/lotes/${params.smp}/docs`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data.docs || []);
        } else {
          setDocs([]);
        }
      } catch {
        setDocs([]);
      }
      setDocsLoading(false);
    }
    fetchDocs();
  }, [params.smp]);

  useEffect(() => {
    hide();
  }, []);

  const handleAddNote = async () => {
    if (newNote.trim() === "" || !listing || !currentUser) return;
    try {
      const res = await fetch(`/api/lotes/${params.smp}/notas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: newNote })
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.nota, ...notes]);
        setNewNote("");
        toast({
          title: "Nota Agregada",
          description: "Tu nota ha sido guardada en el seguimiento del lote.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar la nota.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la nota.",
      });
    }
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

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
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

      let renderWidth = pdfWidth - 20;
      let renderHeight = renderWidth / canvasAspectRatio;

      if (renderHeight > pdfHeight - 20) {
        renderHeight = pdfHeight - 20;
        renderWidth = renderHeight * canvasAspectRatio;
      }

      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = 10;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
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

  // Subir archivo
  const handleFileChangeDocs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("El archivo supera el tamaño máximo de 2MB");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/lotes/${params.smp}/docs`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadError(null);
        // Refrescar lista
        const data = await fetch(`/api/lotes/${params.smp}/docs`).then(r => r.json());
        setDocs(data.docs || []);
        toast({ title: "Archivo subido", description: "El PDF fue adjuntado correctamente." });
      } else {
        const data = await res.json();
        setUploadError(data.error || "Error al subir el archivo");
      }
    } catch {
      setUploadError("Error de red al subir el archivo");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Eliminar archivo
  const handleDeleteDoc = async (ruta: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este archivo?")) return;
    try {
      const res = await fetch(`/api/lotes/${params.smp}/docs/${encodeURIComponent(ruta.replace('uploads/docs/', ''))}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocs(docs.filter(doc => doc.ruta !== ruta));
        toast({ title: "Archivo eliminado", description: "El PDF fue eliminado correctamente." });
      } else {
        const data = await res.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "No se pudo eliminar el archivo." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Error de red al eliminar el archivo." });
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (notFound || !listing) {
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

  // LOGS para depuración de datos de tasación
  console.log('DEBUG listing:', listing);
  console.log('DEBUG vventa:', listing.vventa);
  console.log('DEBUG inctasada:', listing.inctasada);
  console.log('DEBUG fventa:', listing.fventa);
  console.log('DEBUG fpago:', listing.fpago);

  console.log('DEBUG avatar:', { agenteUsuario, agente: listing.agente });

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
            <h1 className="text-3xl font-bold tracking-tight">
              {direccionEspecifica
                ? listing.address.replace(/\d+$/, direccionEspecifica)
                : listing.address}
            </h1>
            <p className="text-muted-foreground">{listing.neighborhood}</p>

          </div>
        </div>
        {canEditLote(currentUser, listing) && (
          <Link href={`/lotes/${listing.smp}/editar`}>
            <Button variant="default"><Edit className="mr-2 h-4 w-4" /> Editar lote</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              {listing.foto_lote ? (
                <div className="relative">
                  <img
                    src={listing.foto_lote}
                    alt={listing.address}
                    className="aspect-video object-cover rounded-lg w-full"
                    onError={(e) => {
                      // Si la imagen falla, mostrar mensaje de error
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'aspect-video bg-muted flex items-center justify-center rounded-lg';
                        errorDiv.innerHTML = '<p class="text-muted-foreground">Imagen no disponible</p>';
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                </div>
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
                  {agenteUsuario && agenteUsuario.foto_perfil ? (
                    <AvatarImage src={agenteUsuario.foto_perfil} alt={`Foto de perfil de ${agenteUsuario.nombre} ${agenteUsuario.apellido}`} />
                  ) : null}
                  <AvatarFallback>
                    {agenteUsuario
                      ? agenteUsuario.iniciales
                      : (listing.agente && listing.agente.length > 0
                        ? listing.agente[0].toUpperCase()
                        : "-")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">
                    {getAgenteNombre(agenteUsuario, listing.agente)}
                  </p>
                  <p className="text-sm text-muted-foreground">Agente a cargo</p>
                </div>
              </div>
            </CardContent>
          </Card>

                     <div className="flex flex-col gap-2">
             {canEditLote(currentUser, listing) && (
               <Dialog open={isEditDialogOpen} onOpenChange={onDialogClose}>
                 <DialogTrigger asChild>
                   <Button variant="default"><Edit className="mr-2 h-4 w-4" /> Editar foto</Button>
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
             )}
             <Button variant="secondary" onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
               <Download className="mr-2 h-4 w-4" />
               {isGeneratingPdf ? "Generando..." : "Descargar Ficha PDF"}
             </Button>
           </div>

          <Card>
            <CardHeader>
              <CardTitle>Informes adjuntos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChangeDocs}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Subiendo..." : "Seleccionar PDF"}
                </Button>
                {uploadError && <div className="text-red-500 text-sm mt-1">{uploadError}</div>}
                <div className="mt-4">
                  {docsLoading ? (
                    <div className="text-muted-foreground text-sm">Cargando archivos...</div>
                  ) : docs.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No hay archivos adjuntos.</div>
                  ) : (
                    <ul className="space-y-2">
                      {docs.map((doc, idx) => (
                        <li key={doc.ruta} className="flex items-center gap-2 border-b pb-1">
                          <a
                            href={`/${doc.ruta}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex-1 truncate"
                            title={doc.ruta.split('/').pop()}
                          >
                            {doc.ruta.split('/').pop()}
                          </a>
                          <span className="text-xs text-muted-foreground ml-2">
                            {doc.fecha ? format(parseISO(doc.fecha), "dd/MM/yyyy") : ""}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {doc.agente}
                          </span>
                          {currentUser?.user === doc.agente && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteDoc(doc.ruta)}
                              title="Eliminar archivo"
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
                    <span className="ml-auto text-muted-foreground">{listing.cur}</span>
                  </div>
                  <div className="flex items-center">
                    <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">M2 Estimados:</span>
                    <span className="ml-auto text-muted-foreground">{listing.area} m²</span>
                  </div>
                  <div className="flex items-center">
                    <Scaling className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Incidencia UVA:</span>
                    <span className="ml-auto text-muted-foreground">{formatDecimal(listing.incidenciaUVA)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">FOT:</span>
                    <span className="ml-auto text-muted-foreground">{formatDecimal(listing.fot)}</span>
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
                    <span className="ml-auto text-muted-foreground">{formatDecimal(listing.alicuota)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {canViewOwnerInfo(currentUser, listing) ? (
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
                      <span className="ml-auto text-muted-foreground">{listing.propietario}</span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Direccion Contacto:</span>
                      <span className="ml-auto text-muted-foreground">{listing.direccion}</span>
                    </div>
                    <div className="flex items-center">
                      <Mailbox className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Codigo Postal:</span>
                      <span className="ml-auto text-muted-foreground">{listing.cp}</span>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Localidad:</span>
                      <span className="ml-auto text-muted-foreground">{listing.localidad}</span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Direccion Alternativa:</span>
                      <span className="ml-auto text-muted-foreground">{listing.direccionalt}</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Fallecido:</span>
                      <span className="ml-auto text-muted-foreground">{formatFallecido(listing.fallecido)}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Correo Electrónico:</span>
                      <span className="ml-auto text-muted-foreground truncate">{listing.mail}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCardIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">CUIT/CUIL:</span>
                      <span className="ml-auto text-muted-foreground">{formatCuitCuil(listing.cuitcuil)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Teléfono 1:</span>
                      <span className="ml-auto text-muted-foreground">{listing.tel1}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Teléfono 2:</span>
                      <span className="ml-auto text-muted-foreground">{listing.tel2}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Teléfono 3:</span>
                      <span className="ml-auto text-muted-foreground">{listing.tel3}</span>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Celular 1:</span>
                      <span className="ml-auto text-muted-foreground">{listing.cel1}</span>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Celular 2:</span>
                      <span className="ml-auto text-muted-foreground">{listing.cel2}</span>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Celular 3:</span>
                      <span className="ml-auto text-muted-foreground">{listing.cel3}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
                    <span className="ml-auto text-muted-foreground">{listing.m2vendibles != null ? Number(listing.m2vendibles).toLocaleString('es-AR') + ' m²' : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Valor de Venta (USD):</span>
                    <span className="ml-auto text-muted-foreground">{listing.vventa != null ? `$ ${Number(listing.vventa).toLocaleString('es-AR')}` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Forma de Pago:</span>
                    <span className="ml-auto text-muted-foreground">{listing.fpago || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Incidencia Tasada (USD/m2):</span>
                    <span className="ml-auto text-muted-foreground">{listing.inctasada != null ? `$ ${Number(listing.inctasada).toLocaleString('es-AR')}` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Fecha de Venta:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.fventa ? format(new Date(listing.fventa), 'dd/MM/yyyy') : 'N/A'}
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
                    <AvatarImage src={currentUser?.foto_perfil || "https://placehold.co/100x100.png"} alt={`Foto de perfil de ${currentUser?.nombre || 'usuario'}`} data-ai-hint="person" />
                    <AvatarFallback>{currentUser ? `${currentUser.nombre?.[0] || ''}${currentUser.apellido?.[0] || ''}`.toUpperCase() : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                    <Textarea
                      placeholder="Escribe una nueva nota de seguimiento..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <Button onClick={handleAddNote} disabled={!newNote.trim() || notesLoading}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Agregar Nota
                    </Button>
                  </div>
                </div>
                <Separator />
                {notesLoading ? (
                  <div className="text-center text-muted-foreground">Cargando notas...</div>
                ) : (
                  <div className="space-y-4">
                    {notes.length === 0 && <div className="text-center text-muted-foreground">No hay notas aún.</div>}
                    {notes.map((note, index) => (
                      <div key={index} className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={note.agente?.avatarUrl || "https://placehold.co/100x100.png"} alt={`Foto de perfil de ${note.agente?.nombre || 'agente'}`} data-ai-hint={note.agente?.aiHint || "person"} />
                          <AvatarFallback>
                            {note.agente?.initials || (note.agente?.nombre ? `${note.agente.nombre[0] || ''}${note.agente.apellido?.[0] || ''}`.toUpperCase() : (note.agente || "?"))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{note.agente?.nombre ? `${note.agente.nombre} ${note.agente.apellido}` : note.agente || "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {note.fecha ? format(parseISO(note.fecha), "dd/MM/yyyy") : ""}
                            </p>
                          </div>
                          <p className="text-base text-muted-foreground">{note.notas}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="absolute -left-[9999px] -top-[9999px]">
        <div ref={pdfContentRef}>
          {listing && <PdfContent ref={pdfContentRef} listing={listing} imageUrl={currentImageUrl} agenteUsuario={agenteUsuario} currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
}
