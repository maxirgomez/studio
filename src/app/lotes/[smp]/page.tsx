"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Scan,
  Ruler,
  Edit,
  Download,
  Upload,
  Library,
  FileText,
  User,
  Home,
  Mailbox,
  Building,
  Phone,
  Smartphone,
  Mail,
  Info,
  XCircle,
  Scaling,
  Percent,
  CreditCard,
  DollarSign,
  MessageSquare,
  Calendar,
  CreditCard as CreditCardIcon,
  X,
  Layers,
  HandHeart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getStatusStyles } from "@/lib/data";
import { useSpinner } from "@/components/ui/SpinnerProvider";
import { useUser } from "@/context/UserContext";
import { use } from "react";
import { useLoteFull } from "@/hooks/use-lote-full";

// Función helper para mostrar "Sin información" cuando fallecido sea "No"
function formatFallecido(value: string | null | undefined): string {
  if (!value || value === "No") {
    return "Sin información";
  }
  return value;
}

// Función helper para generar URL de WhatsApp
function generateWhatsAppUrl(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Limpiar el número de teléfono (remover espacios, guiones, paréntesis)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // Si no empieza con código de país, agregar +54 (Argentina)
  const formattedNumber = cleanNumber.startsWith("+")
    ? cleanNumber
    : `+54${cleanNumber}`;

  return `https://wa.me/${formattedNumber}`;
}

const PdfContent = React.forwardRef<
  HTMLDivElement,
  {
    listing: any;
    imageUrl: string | null | undefined;
    agenteUsuario?: any;
    currentUser?: any;
  }
>(({ listing, imageUrl, agenteUsuario, currentUser }, ref) => {
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "16px",
    marginBottom: "8px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "4px",
    color: "#2D3746",
  };
  const fieldStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: "12px",
  };
  const labelStyle: React.CSSProperties = { fontWeight: "bold", color: "#555" };
  const valueStyle: React.CSSProperties = { color: "#333", textAlign: "right" };
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 24px",
  };

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "Helvetica, Arial, sans-serif",
        color: "#333",
        padding: "40px",
        background: "white",
        width: "210mm",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #eee",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2D3746" }}>
          Baigun Realty
        </div>
        <h1
          style={{
            color: "#2D3746",
            fontSize: "24px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          Ficha de Lote
        </h1>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0" }}>
          {listing.address}
        </h2>
        <p
          style={{
            fontSize: "16px",
            fontWeight: "normal",
            margin: "4px 0",
            color: "#555",
          }}
        >
          {listing.neighborhood}
        </p>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "auto",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
          alt={listing.address}
        />
      )}

      <h3 style={sectionTitleStyle}>Datos Principales</h3>
      <div style={gridStyle}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Estado:</span>{" "}
          <span style={valueStyle}>{listing.status}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Agente:</span>
          <span style={valueStyle}>
            {getAgenteNombre(agenteUsuario, listing.agente)}
          </span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Origen:</span>{" "}
          <span style={valueStyle}>{listing.origen}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>SMP:</span>{" "}
          <span style={valueStyle}>{listing.smp}</span>
        </div>
      </div>

      <h3 style={sectionTitleStyle}>Información Urbanística y Catastral</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Código Urbanístico:</span>{" "}
            <span style={valueStyle}>{listing.cur}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>CPU:</span>{" "}
            <span style={valueStyle}>{listing.cpu}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Superficie de Parcela:</span>{" "}
            <span style={valueStyle}>{listing.sup_parcela || "N/A"} m²</span>
          </div>
        </div>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>M² Estimados:</span>{" "}
            <span style={valueStyle}>{listing.area} m²</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Barrio:</span>{" "}
            <span style={valueStyle}>{listing.neighborhood}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Partida:</span>{" "}
            <span style={valueStyle}>{listing.partida}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Esquina:</span>{" "}
            <span style={valueStyle}>
              {listing.totalFrentes && listing.totalFrentes > 1 ? "Sí" : "No"}
            </span>
          </div>
        </div>
      </div>

      <h4
        style={{
          ...sectionTitleStyle,
          fontSize: "14px",
          marginTop: "12px",
          marginBottom: "6px",
        }}
      >
        Frentes de Parcela
      </h4>
      <div style={{ ...fieldStyle, gridColumn: "span 2" }}>
        <span style={labelStyle}>Total de Frentes:</span>
        <span style={valueStyle}>{listing.totalFrentes || "N/A"}</span>
      </div>

      <h3 style={sectionTitleStyle}>Datos de Tasación</h3>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>M2 Vendibles Reales:</span>{" "}
            <span style={valueStyle}>{listing.m2Vendibles} m²</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Valor de Venta (USD):</span>{" "}
            <span style={valueStyle}>
              {typeof listing.valorVentaUSD === "number"
                ? `$ ${listing.valorVentaUSD.toLocaleString("es-AR")}`
                : "N/A"}
            </span>
          </div>
        </div>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Incidencia Tasada (USD/m2):</span>{" "}
            <span style={valueStyle}>
              {typeof listing.incidenciaTasadaUSD === "number"
                ? `$ ${listing.incidenciaTasadaUSD.toLocaleString("es-AR")}`
                : "N/A"}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Forma de Pago:</span>{" "}
            <span style={valueStyle}>{listing.formaDePago}</span>
          </div>
        </div>
      </div>
      {listing.saleDate && (
        <div style={fieldStyle}>
          <span style={labelStyle}>Fecha de Venta:</span>{" "}
          <span style={valueStyle}>
            {format(new Date(listing.saleDate), "dd/MM/yyyy")}
          </span>
        </div>
      )}

      <h4
        style={{
          ...sectionTitleStyle,
          fontSize: "14px",
          marginTop: "12px",
          marginBottom: "6px",
        }}
      >
        Plusvalía
      </h4>
      <div style={gridStyle}>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Superficie de Parcela:</span>{" "}
            <span style={valueStyle}>{listing.sup_parcela || "N/A"} m²</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Incidencia UVA:</span>{" "}
            <span style={valueStyle}>{listing.incidenciaUVA || "N/A"}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Alícuota:</span>{" "}
            <span style={valueStyle}>{listing.alicuota || "N/A"}%</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>FOT:</span>{" "}
            <span style={valueStyle}>{listing.fot || "N/A"}</span>
          </div>
        </div>
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>A1:</span>{" "}
            <span style={valueStyle}>
              {listing.A1 != null
                ? Number(listing.A1).toLocaleString("es-AR")
                : "N/A"}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>A2:</span>{" "}
            <span style={valueStyle}>
              {listing.A2 != null
                ? Number(listing.A2).toLocaleString("es-AR")
                : "N/A"}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>A1-A2:</span>{" "}
            <span style={valueStyle}>
              {listing["A1-A2"] != null
                ? Number(listing["A1-A2"]).toLocaleString("es-AR")
                : "N/A"}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>B:</span>{" "}
            <span style={valueStyle}>
              {listing.B != null
                ? Number(listing.B).toLocaleString("es-AR")
                : "N/A"}
            </span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>AxB:</span>{" "}
            <span style={valueStyle}>
              {listing.AxB != null
                ? Number(listing.AxB).toLocaleString("es-AR")
                : "N/A"}
            </span>
          </div>
          
        </div>
      </div>

      {canViewOwnerInfo(currentUser, listing) && (
        <>
          <h3 style={sectionTitleStyle}>Información del Propietario</h3>
          <div style={gridStyle}>
            <div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Propietario:</span>{" "}
                <span style={valueStyle}>{listing.propietario}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Dirección Contacto:</span>{" "}
                <span style={valueStyle}>{listing.direccion}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Localidad:</span>{" "}
                <span style={valueStyle}>{listing.localidad}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Dirección Alternativa:</span>{" "}
                <span style={valueStyle}>{listing.direccionalt}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Fallecido:</span>{" "}
                <span style={valueStyle}>
                  {formatFallecido(listing.fallecido)}
                </span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Email:</span>{" "}
                <span style={valueStyle}>{listing.mail}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Cuit/Cuil:</span>{" "}
                <span style={valueStyle}>
                  {formatCuitCuil(listing.cuitcuil)}
                </span>
              </div>
            </div>
            <div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Teléfono 1:</span>{" "}
                <span style={valueStyle}>{listing.tel1}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Teléfono 2:</span>{" "}
                <span style={valueStyle}>{listing.tel2}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Teléfono 3:</span>{" "}
                <span style={valueStyle}>{listing.tel3}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Celular 1:</span>{" "}
                <span style={valueStyle}>{listing.cel1}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Celular 2:</span>{" "}
                <span style={valueStyle}>{listing.cel2}</span>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Celular 3:</span>{" "}
                <span style={valueStyle}>{listing.cel3}</span>
              </div>
            </div>
          </div>
        </>
      )}
      <div style={{ marginTop: "16px" }}>
        <h3 style={sectionTitleStyle}>Seguimiento/Notas del lote</h3>
        {listing.otros ? (
          <p style={{ fontSize: "12px", color: "#333" }}>{listing.otros}</p>
        ) : (
          <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>
            Sin comentarios adicionales
          </p>
        )}
      </div>
    </div>
  );
});
PdfContent.displayName = "PdfContent";

function getAgenteNombre(agenteUsuario: any, agente: string) {
  if (agenteUsuario && agenteUsuario.nombre && agenteUsuario.apellido) {
    return `${agenteUsuario.nombre} ${agenteUsuario.apellido}`;
  }
  return agente || "-";
}

function formatCuitCuil(cuitcuil: any): string {
  if (!cuitcuil) return "";
  const str = String(cuitcuil).replace(/\.0+$/, ""); // Eliminar .0000000000
  if (/^\d{11}$/.test(str)) {
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
  }
  return str;
}

// Función helper para verificar si el usuario puede ver información del propietario
function canViewOwnerInfo(currentUser: any, listing: any): boolean {
  // Debug logs para entender qué está pasando
  // Solo los administradores tienen acceso total
  const isAdmin = currentUser?.rol === "Administrador";

  if (isAdmin) {
    return true;
  }

  // El usuario asignado al lote también puede ver la información
  const agenteValue = listing?.agente;
  const currentUserValue = currentUser?.user;

  const isAssignedAgent =
    currentUserValue &&
    agenteValue &&
    currentUserValue.toLowerCase() === agenteValue.toLowerCase();

  if (isAssignedAgent) {
    return true;
  }

  return false;
}

// Función helper para verificar si el usuario puede editar el lote
function canEditLote(currentUser: any, listing: any): boolean {
  // Solo los administradores tienen acceso total
  const isAdmin = currentUser?.rol === "Administrador";

  if (isAdmin) {
    return true;
  }

  // El usuario asignado al lote también puede editarlo
  const agenteValue = listing?.agente;
  const currentUserValue = currentUser?.user;

  const isAssignedAgent =
    currentUserValue &&
    agenteValue &&
    currentUserValue.toLowerCase() === agenteValue.toLowerCase();

  if (isAssignedAgent) {
    return true;
  }

  return false;
}

function formatDecimal(value: any) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  if (Number.isInteger(num)) return num;
  const str = String(value);
  const [, decimals] = str.split(".");
  if (decimals && decimals.replace(/0+$/, "").length > 2) {
    return num;
  }
  return num.toFixed(2).replace(/\.00$/, "");
}

export default function LoteDetailPage() {
  const params = useParams<{ smp: string }>();
  const { user: currentUser } = useUser();
  
  // ✅ REACT QUERY: Hook con caché inteligente
  const {
    lote: listing,
    agenteUsuario,
    notas: notes,
    frentes,
    superficieParcela,
    isEsquina,
    docs,
    isLoading: loading,
    isError,
    invalidate: invalidateLoteCache,
  } = useLoteFull(params.smp);
  
  const [notFound, setNotFound] = useState(false);

  // Detectar parámetro de dirección específica
  const [direccionEspecifica, setDireccionEspecifica] = useState<string | null>(
    null
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(listing?.imageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Estados locales para UI (no afectados por caché)
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null); // ✅ Cambiar a string para ID único
  const [editingNoteText, setEditingNoteText] = useState("");
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { hide } = useSpinner();
  const [solicitando, setSolicitando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de loading separados (para compatibilidad con código existente)
  const notesLoading = loading;
  const frentesLoading = loading;
  const docsLoading = loading;

  // Detectar parámetro de dirección en la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const direccion = urlParams.get("direccion");
      setDireccionEspecifica(direccion);
    }
  }, []);
  
  // Manejar estado de error de React Query
  useEffect(() => {
    if (isError) {
      setNotFound(true);
    }
  }, [isError]);

  useEffect(() => {
    hide();
  }, []);

  const handleAddNote = async () => {
    if (newNote.trim() === "" || !listing || !currentUser) return;
    try {
      // ✅ Obtener token para autenticación
      const token = localStorage.getItem('auth_token');
      
      const res = await fetch(`/api/lotes/${params.smp}/notas`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }) // ✅ Agregar token
        },
        credentials: 'include',
        body: JSON.stringify({ nota: newNote }),
      });
      if (res.ok) {
        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
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

  const handleEditNote = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(currentText);
  };

  const handleSaveEdit = async () => {
    if (editingNoteId === null || !editingNoteText.trim()) return;

    try {
      // ✅ Buscar la nota por ID único
      const noteToEdit = notes.find(note => note.id === editingNoteId);
      if (!noteToEdit) return;

      const token = localStorage.getItem('auth_token');
      
      // ✅ Convertir fecha a formato ISO (YYYY-MM-DD) para que coincida con la BD
      const fechaISO = noteToEdit.fecha instanceof Date
        ? noteToEdit.fecha.toISOString().split('T')[0]
        : String(noteToEdit.fecha).split('T')[0];
      
      const res = await fetch(`/api/lotes/${params.smp}/notas/update`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          agente: noteToEdit.agente?.user || noteToEdit.agente,
          fecha: fechaISO, // ✅ Usar formato ISO consistente
          nota: editingNoteText,
        }),
      });

      if (res.ok) {
        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
        setEditingNoteId(null);
        setEditingNoteText("");
        toast({
          title: "Nota actualizada",
          description: "La nota se ha actualizado correctamente.",
        });
      } else {
        throw new Error("Error al actualizar nota");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la nota.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta nota?")) return;

    try {
      // ✅ Buscar la nota por ID único
      const noteToDelete = notes.find(note => note.id === noteId);
      if (!noteToDelete) {
        toast({
          title: "Error",
          description: "No se encontró la nota a eliminar.",
          variant: "destructive",
        });
        return;
      }

      const token = localStorage.getItem('auth_token');
      const isAdmin = currentUser?.rol === 'Administrador';
      
      // ✅ Extraer el usuario del agente (puede ser objeto o string)
      let agenteUsuario: string | null = null;
      
      // Debug: verificar la estructura de la nota
      console.log('🔍 Nota a eliminar:', {
        id: noteToDelete.id,
        agente: noteToDelete.agente,
        tipoAgente: typeof noteToDelete.agente,
        agenteUser: noteToDelete.agente?.user,
        isAdmin,
      });
      
      if (typeof noteToDelete.agente === 'string') {
        // El agente es directamente un string
        agenteUsuario = noteToDelete.agente || null;
      } else if (noteToDelete.agente && typeof noteToDelete.agente === 'object') {
        // El agente es un objeto, extraer el user
        agenteUsuario = (noteToDelete.agente as any)?.user || null;
      } else if (!noteToDelete.agente) {
        // El agente es null o undefined
        agenteUsuario = null;
      }
      
      // Si no hay agente y el usuario no es admin, no puede eliminar
      if (!agenteUsuario && !isAdmin) {
        console.error('❌ No se pudo obtener el agente de la nota:', noteToDelete);
        toast({
          title: "Error",
          description: "Esta nota no tiene un agente asignado. Solo los administradores pueden eliminarla.",
          variant: "destructive",
        });
        return;
      }
      
      // ✅ Convertir fecha a formato ISO (YYYY-MM-DD) para que coincida con la BD
      let fechaISO: string | null = null;
      const notaSinFecha = !noteToDelete.fecha || noteToDelete.fecha === null;
      
      // Si la nota no tiene fecha, solo los administradores pueden eliminarla
      if (notaSinFecha && !isAdmin) {
        console.error('❌ La nota no tiene fecha y el usuario no es admin:', noteToDelete);
        toast({
          title: "Error",
          description: "Esta nota no tiene una fecha válida. Solo los administradores pueden eliminarla.",
          variant: "destructive",
        });
        return;
      }
      
      // Si la nota tiene fecha, normalizarla
      if (!notaSinFecha) {
        try {
          if (noteToDelete.fecha instanceof Date) {
            fechaISO = noteToDelete.fecha.toISOString().split('T')[0];
          } else if (typeof noteToDelete.fecha === 'string') {
            // Validar que no sea el string "null" o vacío
            if (noteToDelete.fecha === 'null' || noteToDelete.fecha.trim() === '') {
              throw new Error('Fecha inválida: string vacío o "null"');
            }
            fechaISO = noteToDelete.fecha.split('T')[0].split(' ')[0];
            // Validar formato básico
            if (!fechaISO || fechaISO.length < 10 || !/^\d{4}-\d{2}-\d{2}/.test(fechaISO)) {
              throw new Error('Formato de fecha inválido');
            }
          } else {
            // Intentar convertir otros tipos a string
            const fechaStr = String(noteToDelete.fecha);
            if (fechaStr === 'null' || fechaStr === 'undefined' || fechaStr.trim() === '') {
              throw new Error('Fecha inválida: no se pudo convertir a fecha válida');
            }
            fechaISO = fechaStr.split('T')[0].split(' ')[0];
            if (!fechaISO || fechaISO.length < 10 || !/^\d{4}-\d{2}-\d{2}/.test(fechaISO)) {
              throw new Error('Formato de fecha inválido después de conversión');
            }
          }
        } catch (error) {
          console.error('❌ Error al convertir fecha:', error, { fecha: noteToDelete.fecha });
          toast({
            title: "Error",
            description: "No se pudo procesar la fecha de la nota. Por favor, contacta al administrador.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Preparar body: si no hay fecha, enviar el contenido de la nota como identificador alternativo
      const body: any = {
        agente: agenteUsuario || null,
      };
      
      if (fechaISO) {
        body.fecha = fechaISO;
      } else if (isAdmin && notaSinFecha) {
        // Si es admin y no hay fecha, usar el contenido de la nota como identificador
        body.notas = noteToDelete.notas || null;
        body.sinFecha = true; // Flag para indicar que no hay fecha
      } else {
        toast({
          title: "Error",
          description: "No se pudo identificar la nota para eliminar.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`/api/lotes/${params.smp}/notas/delete`, {
        method: "DELETE",
        headers,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
        toast({
          title: "Nota eliminada",
          description: "La nota se ha eliminado correctamente.",
        });
      } else {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "Error al eliminar nota");
      }
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la nota.",
        variant: "destructive",
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
  };

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
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
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

      pdf.addImage(
        imgData,
        "JPEG",
        xOffset,
        yOffset,
        renderWidth,
        renderHeight
      );
      pdf.save(`ficha-lote-${listing.smp}.pdf`);

      toast({
        title: "PDF Generado",
        description: `La ficha del lote ${listing.address} se ha descargado.`,
      });
    } catch (error) {
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
  const handleFileChangeDocs = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
        toast({
          title: "Archivo subido",
          description: "El PDF fue adjuntado correctamente.",
        });
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
      const res = await fetch(
        `/api/lotes/${params.smp}/docs/${encodeURIComponent(
          ruta.replace("uploads/docs/", "")
        )}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
        toast({
          title: "Archivo eliminado",
          description: "El PDF fue eliminado correctamente.",
        });
      } else {
        const data = await res.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "No se pudo eliminar el archivo.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error de red al eliminar el archivo.",
      });
    }
  };

  // Solicitar lote
  const handleSolicitarLote = async () => {
    if (!currentUser || !listing) return;

    setSolicitando(true);
    try {
      const res = await fetch(`/api/lotes/${params.smp}/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioSolicitante: currentUser.user,
          motivo: "Solicitud de transferencia de lote",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Solicitud Enviada",
          description: `Tu solicitud ha sido enviada al agente ${listing.agente}.`,
        });

        // ✅ Invalidar caché para recargar datos frescos
        invalidateLoteCache();
      } else {
        throw new Error(data.error || "Error al enviar solicitud");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la solicitud.",
      });
    }
    setSolicitando(false);
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

  // LOG AL INICIO DEL RENDER
  
  if (notes && notes.length > 0) {
  
  }

  // LOGS para depuración de datos de tasación

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
            <Button variant="default">
              <Edit className="mr-2 h-4 w-4" /> Editar lote
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              {listing.foto_lote ? (
                <SafeImage
                  src={listing.foto_lote}
                  alt={listing.address}
                  width={600}
                  height={400}
                  className="aspect-video object-cover rounded-lg"
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
                <Badge style={getStatusStyles(listing.status)}>
                  {listing.status}
                </Badge>
              </div>
              <div className="flex items-center pt-2">
                <Avatar className="h-10 w-10 mr-4">
                  {agenteUsuario && agenteUsuario.foto_perfil ? (
                    <AvatarImage
                      src={agenteUsuario.foto_perfil}
                      alt={`Foto de perfil de ${agenteUsuario.nombre} ${agenteUsuario.apellido}`}
                    />
                  ) : null}
                  <AvatarFallback>
                    {agenteUsuario
                      ? agenteUsuario.iniciales
                      : listing.agente && listing.agente.length > 0
                      ? listing.agente[0].toUpperCase()
                      : "-"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">
                    {getAgenteNombre(agenteUsuario, listing.agente)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Agente a cargo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            {canEditLote(currentUser, listing) && (
              <Dialog open={isEditDialogOpen} onOpenChange={onDialogClose}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Edit className="mr-2 h-4 w-4" /> Editar foto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Foto del Lote</DialogTitle>
                    <DialogDescription>
                      Selecciona una nueva imagen para el lote. La imagen se
                      actualizará al guardar los cambios.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="picture">Nueva Foto</Label>
                      <Input
                        id="picture"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </div>
                    {(previewUrl || currentImageUrl) && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                          Vista Previa:
                        </p>
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
                      <Button type="button" variant="secondary">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={!selectedFile}
                    >
                      Guardar Cambios
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Botón Solicitar Lote */}
            {currentUser &&
              currentUser.user !== listing.agente &&
              !listing.status?.includes("Solicitado por " + currentUser.user) &&
              !listing.status?.includes("En transferencia") && (
                <Button
                  variant="outline"
                  onClick={handleSolicitarLote}
                  disabled={solicitando}
                  className="w-full"
                >
                  <HandHeart className="mr-2 h-4 w-4" />
                  {solicitando ? "Enviando..." : "Solicitar Lote"}
                </Button>
              )}

            {/* Mostrar estado de solicitud */}
            {listing.status?.includes("Solicitado por") && (
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⏳ {listing.status}
                </p>
              </div>
            )}

            {listing.status === "En transferencia" && (
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔄 Transferencia en proceso...
                </p>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
            >
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
                {uploadError && (
                  <div className="text-red-500 text-sm mt-1">{uploadError}</div>
                )}
                <div className="mt-4">
                  {docsLoading ? (
                    <div className="text-muted-foreground text-sm">
                      Cargando archivos...
                    </div>
                  ) : docs.length === 0 ? (
                    <div className="text-muted-foreground text-sm">
                      No hay archivos adjuntos.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {docs.map((doc: any, idx: number) => (
                        <li
                          key={doc.ruta}
                          className="flex items-center gap-2 border-b pb-1"
                        >
                          <a
                            href={`/${doc.ruta}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex-1 truncate"
                            title={doc.ruta.split("/").pop()}
                          >
                            {doc.ruta.split("/").pop()}
                          </a>
                          <span className="text-xs text-muted-foreground ml-2">
                            {doc.fecha
                              ? format(parseISO(doc.fecha), "dd/MM/yyyy")
                              : ""}
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
                    <span className="ml-auto text-muted-foreground">
                      {listing.smp}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Library className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Código Urbanístico:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.cur}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">M2 Estimados:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.area} m²
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Ruler className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Superficie de Parcela:</span>
                    <span className="ml-auto text-muted-foreground">
                      {superficieParcela
                        ? `${superficieParcela.toLocaleString("es-AR")} m²`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Tipo:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.tipo || "N/A"}
                    </span>
                  </div>
                  <div className="d-flex flex-column">
                    {/* Sección Frentes de Parcela integrada */}
                    <CardTitle className="text-lg font-semibold mb-4 text-muted-foreground">Frentes de Parcela</CardTitle>
                    {frentesLoading ? (
                      <div className="text-center text-muted-foreground">
                        Cargando frentes...
                      </div>
                    ) : frentes.length === 0 ? (
                      <div className="text-center text-muted-foreground">
                        No hay información de frentes disponible
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {frentes.map((frente: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 " />
                                <span className="text-muted-foreground">
                                  {frente.calle}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium">N°</span>
                                <span className="text-muted-foreground ml-1">
                                  {frente.numero}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Ruler className="h-4 w-4 mr-2" />
                              <span className="text-muted-foreground">
                                {frente.ancho_frente} m
                              </span>
                            </div>
                          </div>
                        ))}
                        {isEsquina && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 text-center">
                              ⚠️ Lote de esquina: Este lote tiene{" "}
                              {frentes.length} frente(s)
                              {frentes.length > 1 ? "s" : ""} con diferentes
                              anchos
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Barrio:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.neighborhood}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">CPU:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.cpu}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Partida:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.partida}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Esquina:</span>
                    <span className="ml-auto text-muted-foreground">
                      {isEsquina ? "Sí" : "No"}
                    </span>
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
                      <span className="ml-auto text-muted-foreground">
                        {listing.propietario}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Direccion Contacto:</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.direccion}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mailbox className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Codigo Postal:</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.cp}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Building className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Localidad:</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.localidad}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">
                        Direccion Alternativa:
                      </span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.direccionalt}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Fallecido:</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatFallecido(listing.fallecido)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">Correo Electrónico:</span>
                      <span className="ml-auto text-muted-foreground truncate">
                        {listing.mail}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CreditCardIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                      <span className="font-medium">CUIT/CUIL:</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatCuitCuil(listing.cuitcuil)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(listing)
                      .filter(([key, value]) => key.startsWith('tel') && value)
                      .map(([key, tel], index) => (
                        <div key={key} className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Teléfono {index + 1}:</span>
                          <span className="ml-auto text-muted-foreground">
                            {tel as string}
                          </span>
                        </div>
                      ))}
                    {Object.entries(listing)
                      .filter(([key, value]) => key.startsWith('cel') && value)
                      .map(([key, cel], index) => (
                        <div key={key} className="flex items-center">
                          <Smartphone className="h-5 w-5 mr-3 text-muted-foreground" />
                          <span className="font-medium">Celular {index + 1}:</span>
                          <span className="ml-auto">
                            <a
                              href={generateWhatsAppUrl(cel as string)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex text-muted-foreground hover:text-foreground hover:underline"
                            >
                              {cel as string}
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp ml-2" viewBox="0 0 16 16">
                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                              </svg>
                            </a>
                          </span>
                        </div>
                      ))}
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
                    <span className="font-medium">M2 Vendibles Reales:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.m2vendibles != null
                        ? Number(listing.m2vendibles).toLocaleString("es-AR") +
                          " m²"
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Valor de Venta (USD):</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.vventa != null
                        ? `$ ${Number(listing.vventa).toLocaleString("es-AR")}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Forma de Pago:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.fpago || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">
                      Incidencia Tasada (USD/m2):
                    </span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.inctasada != null
                        ? `$ ${Number(listing.inctasada).toLocaleString(
                            "es-AR"
                          )}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="font-medium">Fecha de Venta:</span>
                    <span className="ml-auto text-muted-foreground">
                      {listing.fventa
                        ? format(new Date(listing.fventa), "dd/MM/yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección Plusvalía */}
              <div className="mt-6 pt-4 border-t">
                <CardTitle className="text-lg font-semibold mb-4 text-muted-foreground">Plusvalía</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="font-medium">
                        Superficie de Parcela:
                      </span>
                      <span className="ml-auto text-muted-foreground">
                        {superficieParcela
                          ? `${superficieParcela.toLocaleString("es-AR")} m²`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Incidencia UVA:</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatDecimal(listing.incidenciaUVA)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Alícuota:</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatDecimal(listing.alicuota)}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">FOT:</span>
                      <span className="ml-auto text-muted-foreground">
                        {formatDecimal(listing.fot)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="font-medium">A1 (Área CUr * 0,8):</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.A1 != null
                          ? Number(listing.A1).toLocaleString("es-AR")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">A2 (Área FOT):</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing.A2 != null
                          ? Number(listing.A2).toLocaleString("es-AR")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">A1-A2:</span>
                      <span className="ml-auto text-muted-foreground">
                        {listing["A1-A2"] != null
                          ? Number(listing["A1-A2"]).toLocaleString("es-AR")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-medium">B (Inicidencia * Alícuota):</span>
                        <span className="ml-auto text-muted-foreground">
                          {listing.B != null
                            ? Number(listing.B).toLocaleString("es-AR")
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">AxB (UVAs Estimadas):</span>
                        <span className="ml-auto text-muted-foreground">
                          {listing.AxB != null
                            ? Number(listing.AxB).toLocaleString("es-AR")
                            : "N/A"}
                        </span>
                      </div>
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
                    <AvatarImage
                      src={
                        currentUser?.foto_perfil ||
                        "https://placehold.co/100x100.png"
                      }
                      alt={`Foto de perfil de ${
                        currentUser?.nombre || "usuario"
                      }`}
                      data-ai-hint="person"
                    />
                    <AvatarFallback>
                      {currentUser
                        ? `${currentUser.nombre?.[0] || ""}${
                            currentUser.apellido?.[0] || ""
                          }`.toUpperCase()
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-full space-y-2">
                    <Textarea
                      placeholder="Escribe una nueva nota de seguimiento..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || notesLoading}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Agregar Nota
                    </Button>
                  </div>
                </div>
                <Separator />
                {notesLoading ? (
                  <div className="text-center text-muted-foreground">
                    Cargando notas...
                  </div>
                ) : (
                  <div className="space-y-4">
                                         {notes.length === 0 && (
                       <div className="text-center text-muted-foreground">
                         No hay notas aún.
                       </div>
                     )}
                     {(() => {
                       
                       return null;
                     })()}
                     {notes.map((note, index) => {
                       // LOG MUY VISIBLE AL INICIO
                       
                       
                       // LOGS DE DEBUG DETALLADOS
                       
                       
                       if (note.agente && typeof note.agente === 'object' && note.agente !== null) {
                       
                       }
                       
                       // Verificar si el usuario actual puede editar/eliminar esta nota
                       // MEJORAR: Manejar correctamente cuando note.agente es un objeto
                       let agenteUserValue: string | null = null;
                       if (typeof note.agente === 'string') {
                         agenteUserValue = note.agente;
                         
                       } else if (note.agente && typeof note.agente === 'object' && note.agente !== null) {
                         agenteUserValue = (note.agente as any).user || null;
                         
                       }
                       
                       const isCurrentUserNote = currentUser && currentUser.user && agenteUserValue && 
                         (currentUser.user.toLowerCase() === agenteUserValue.toLowerCase());
                       
                       
                       
                       // Los administradores pueden eliminar cualquier nota
                       const isAdmin = currentUser?.rol === 'Administrador';
                       const canDelete = isCurrentUserNote || isAdmin;
                       const canEdit = isCurrentUserNote; // Solo el dueño puede editar
                       const isEditing = editingNoteId === note.id;
                       
                       // Función helper para obtener el string seguro del agente
                       const getAgenteDisplayName = (): string => {
                         try {
                           
                           
                           if (!note.agente) {
                           
                             return "-";
                           }
                           
                           if (typeof note.agente === 'string') {
                           
                             return note.agente;
                           }
                           
                           if (typeof note.agente === 'object' && note.agente !== null && !Array.isArray(note.agente)) {
                             const agenteObj = note.agente as any;
                           
                             
                             const nombre = typeof agenteObj.nombre === 'string' ? agenteObj.nombre.trim() : '';
                             const apellido = typeof agenteObj.apellido === 'string' ? agenteObj.apellido.trim() : '';
                             
                           
                             
                             if (nombre && apellido) {
                               const result = `${nombre} ${apellido}`;
                           
                               return result;
                             }
                             if (nombre) {
                           
                               return nombre;
                             }
                             if (apellido) {
                           
                               return apellido;
                             }
                             const user = typeof agenteObj.user === 'string' ? agenteObj.user.trim() : '';
                             if (user) {
                           
                               return user;
                             }
                           }
                           
                           // NUNCA retornar el objeto directamente
                           
                           return "-";
                         } catch (error) {
                           console.error('❌ [ERROR] getAgenteDisplayName:', error);
                           return "-";
                         }
                       };
                       
                       const getAgenteInitials = (): string => {
                         try {
                           
                           
                           if (!note.agente) {
                             
                             return "?";
                           }
                           
                           // Si es un string, devolver la primera letra
                           if (typeof note.agente === 'string') {
                             const firstChar = note.agente.trim()[0];
                             const result = firstChar ? firstChar.toUpperCase() : "?";
                             
                             return result;
                           }
                           
                           // Si es un objeto
                           if (typeof note.agente === 'object' && note.agente !== null && !Array.isArray(note.agente)) {
                             const agenteObj = note.agente as any;
                             
                             
                             // PRIMERO: Intentar usar initials si existe y es string válido
                             if (agenteObj.initials && typeof agenteObj.initials === 'string' && agenteObj.initials.trim().length > 0) {
                               const result = agenteObj.initials.trim().substring(0, 2).toUpperCase();
                             
                               return result;
                             }
                             
                             // SEGUNDO: Intentar generar desde nombre y apellido
                             const nombre = typeof agenteObj.nombre === 'string' ? agenteObj.nombre.trim() : '';
                             const apellido = typeof agenteObj.apellido === 'string' ? agenteObj.apellido.trim() : '';
                             
                             
                             
                             if (nombre) {
                               const firstLetter = nombre[0] || '';
                               const lastLetter = apellido ? apellido[0] || '' : '';
                               const initials = `${firstLetter}${lastLetter}`.trim().toUpperCase();
                               if (initials) {
                             
                                 return initials;
                               }
                             }
                             
                             // TERCERO: Intentar desde user
                             const user = typeof agenteObj.user === 'string' ? agenteObj.user.trim() : '';
                             if (user) {
                               const firstChar = user[0];
                               if (firstChar) {
                                 const result = firstChar.toUpperCase();
                             
                                 return result;
                               }
                             }
                           }
                           
                           // Fallback: siempre retornar string
                           
                           return "?";
                         } catch (error) {
                           console.error('❌ [ERROR] getAgenteInitials:', error);
                           return "?";
                         }
                       };
                       
                       // Obtener valores ANTES de renderizar
                       const agenteDisplayName = getAgenteDisplayName();
                       const agenteInitials = getAgenteInitials();
                       
                       
                       
                                              // Validación final: asegurar que son strings
                       if (typeof agenteDisplayName !== 'string') {
                         console.error('❌ [ERROR CRÍTICO] agenteDisplayName NO es string:', agenteDisplayName);
                       }
                       if (typeof agenteInitials !== 'string') {
                         console.error('❌ [ERROR CRÍTICO] agenteInitials NO es string:', agenteInitials);
                       }
                       
                       // FORZAR conversión a string por seguridad - NUNCA pasar objetos
                       const safeDisplayName: string = typeof agenteDisplayName === 'string' ? agenteDisplayName : String(agenteDisplayName || '-');
                       const safeInitials: string = typeof agenteInitials === 'string' ? agenteInitials : String(agenteInitials || '?');
                       
                       
                       
                       return (
                         <div key={note.id || index} className="flex gap-4">
                           <Avatar>
                             <AvatarImage 
                               src={
                                 (note.agente && typeof note.agente === 'object' && note.agente !== null)
                                   ? (note.agente as any).avatarUrl || "https://placehold.co/100x100.png"
                                   : "https://placehold.co/100x100.png"
                               } 
                               alt={`Foto de perfil de ${safeDisplayName}`} 
                               data-ai-hint="person" 
                             />
                             <AvatarFallback name={safeDisplayName}>
                               {safeInitials}
                             </AvatarFallback>
                           </Avatar>
                           <div className="flex-1">
                             <div className="flex items-center justify-between">
                               <p className="text-sm font-medium">
                                 {safeDisplayName}
                               </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {note.fecha
                                    ? format(parseISO(note.fecha), "dd/MM/yyyy")
                                    : ""}
                                </p>
                                {editingNoteId !== note.id && (
                                  <div className="flex gap-1">
                                    {canEdit && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditNote(note.id, note.notas)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        title={isAdmin && !isCurrentUserNote ? "Eliminar como administrador" : "Eliminar nota"}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingNoteId === note.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editingNoteText}
                                  onChange={(e) =>
                                    setEditingNoteText(e.target.value)
                                  }
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="h-8"
                                  >
                                    Guardar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="h-8"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-base text-muted-foreground">
                                {note.notas}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="absolute -left-[9999px] -top-[9999px]">
        <div ref={pdfContentRef}>
          {listing && (
            <PdfContent
              ref={pdfContentRef}
              listing={listing}
              imageUrl={currentImageUrl}
              agenteUsuario={agenteUsuario}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

