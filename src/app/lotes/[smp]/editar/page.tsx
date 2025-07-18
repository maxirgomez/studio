
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, Scan, Ruler, Building, FileText, User, Home, Mailbox, Phone, Smartphone, Mail, Info, XCircle, Scaling, Percent, CreditCard, DollarSign, Library, Calendar as CalendarIcon } from "lucide-react"
import { listings } from "@/lib/data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const editLoteFormSchema = z.object({
  propietario: z.string().optional(),
  direccionContacto: z.string().optional(),
  codigoPostal: z.string().optional(),
  localidad: z.string().optional(),
  direccionAlternativa: z.string().optional(),
  fallecido: z.string().optional(),
  otrosDatos: z.string().max(200, "Máximo 200 caracteres.").optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  telefono3: z.string().optional(),
  celular1: z.string().optional(),
  celular2: z.string().optional(),
  celular3: z.string().optional(),
  email: z.string().email("Email inválido.").or(z.literal("")).optional(),
  cuitcuil: z.string().optional(),
  
  m2Vendibles: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.").optional()),
  valorVentaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.").optional()),
  incidenciaTasadaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.").optional()),
  formaDePago: z.string().optional(),
  fechaVenta: z.date().optional(),
});

type EditLoteFormValues = z.infer<typeof editLoteFormSchema>;

function formatCuitCuil(cuitcuil: any): string {
  if (!cuitcuil) return '';
  
  // Convertir a string y limpiar
  const str = String(cuitcuil).replace(/\.0+$/, ''); // Eliminar .0000000000
  
  // Si es un número válido, formatearlo como CUIT/CUIL
  if (/^\d{11}$/.test(str)) {
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
  }
  
  // Si ya tiene formato o es otro tipo de dato, devolverlo tal como está
  return str;
}

export default function LoteEditPage() {
  const params = useParams<{ smp: string }>();
  const router = useRouter();
  const { toast } = useToast();

  // Estado para el lote real
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false); // Nuevo estado para loader

  useEffect(() => {
    async function fetchLote() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/lotes/${params.smp}`);
        if (res.status === 404) {
          setNotFound(true);
          setListing(null);
        } else {
          const data = await res.json();
          setListing(data.lote);
        }
      } catch (e) {
        setNotFound(true);
        setListing(null);
      }
      setLoading(false);
    }
    fetchLote();
  }, [params.smp]);

  // Valores por defecto SIEMPRE definidos
  const defaultFormValues: EditLoteFormValues = {
    propietario: listing?.propietario ?? "",
    direccionContacto: listing?.direccion ?? "",
    codigoPostal: listing?.cp ?? "",
    localidad: listing?.localidad ?? "",
    direccionAlternativa: listing?.direccionalt ?? "",
    fallecido: listing?.fallecido ?? "No",
    otrosDatos: listing?.otrosDatos ?? "",
    telefono1: listing?.tel1 ?? "",
    telefono2: listing?.tel2 ?? "",
    telefono3: listing?.tel3 ?? "",
    celular1: listing?.cel1 ?? "",
    celular2: listing?.cel2 ?? "",
    celular3: listing?.cel3 ?? "",
    email: listing?.email ?? "", // CAMBIO mail -> email
    cuitcuil: listing?.cuitcuil ?? "",
    m2Vendibles: listing?.m2Vendibles ?? listing?.m2vendibles ?? 0, // CAMBIO m2_vendibles -> m2vendibles
    valorVentaUSD: listing?.valorVentaUSD ?? listing?.vventa ?? 0, // CAMBIO valor_venta_usd -> valorventausd
    incidenciaTasadaUSD: listing?.incidenciaTasadaUSD ?? listing?.inctasada ?? 0,
    formaDePago: listing?.formaDePago ?? listing?.fpago ?? "",
    fechaVenta: listing?.fechaVenta ? new Date(listing.fechaVenta) : (listing?.fventa ? new Date(listing.fventa) : undefined), // CAMBIO fechaventa -> fventa
  };

  const form = useForm<EditLoteFormValues>({
    resolver: zodResolver(editLoteFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  // Resetear el formulario cuando llega el lote real
  useEffect(() => {
    if (listing) {
      form.reset({
        propietario: listing.propietario ?? "",
        direccionContacto: listing.direccion ?? "",
        codigoPostal: listing.cp ?? "",
        localidad: listing.localidad ?? "",
        direccionAlternativa: listing.direccionalt ?? "",
        fallecido: listing.fallecido ?? "No",
        otrosDatos: listing.otrosDatos ?? "",
        telefono1: listing.tel1 ?? "",
        telefono2: listing.tel2 ?? "",
        telefono3: listing.tel3 ?? "",
        celular1: listing.cel1 ?? "",
        celular2: listing.cel2 ?? "",
        celular3: listing.cel3 ?? "",
        email: listing.email ?? "", // CAMBIO mail -> email
        cuitcuil: formatCuitCuil(listing.cuitcuil),
        m2Vendibles: listing.m2Vendibles ?? listing.m2vendibles ?? 0, // CAMBIO m2_vendibles -> m2vendibles
        valorVentaUSD: listing.valorVentaUSD ?? listing.vventa ?? 0, // CAMBIO valor_venta_usd -> valorventausd
        incidenciaTasadaUSD: listing.incidenciaTasadaUSD ?? listing.inctasada ?? 0,
        formaDePago: listing.formaDePago ?? listing.fpago ?? "",
        fechaVenta: listing.fechaVenta ? new Date(listing.fechaVenta) : (listing.fventa ? new Date(listing.fventa) : undefined), // CAMBIO fechaventa -> fventa
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
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
  
  async function onSubmit(data: EditLoteFormValues) {
    setSaving(true);
    // Normalizar campos numéricos vacíos a null
    const safeData = {
      ...data,
      m2Vendibles: data.m2Vendibles === undefined || isNaN(data.m2Vendibles as number) ? null : data.m2Vendibles,
      valorVentaUSD: data.valorVentaUSD === undefined || isNaN(data.valorVentaUSD as number) ? null : data.valorVentaUSD,
      incidenciaTasadaUSD: data.incidenciaTasadaUSD === undefined || isNaN(data.incidenciaTasadaUSD as number) ? null : data.incidenciaTasadaUSD,
    };
    try {
      const res = await fetch(`/api/lotes/${params.smp}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propietario: safeData.propietario,
          direccion: safeData.direccionContacto,
          cp: safeData.codigoPostal,
          localidad: safeData.localidad,
          direccionalt: safeData.direccionAlternativa,
          fallecido: safeData.fallecido,
          otrosDatos: safeData.otrosDatos,
          tel1: safeData.telefono1,
          tel2: safeData.telefono2,
          tel3: safeData.telefono3,
          cel1: safeData.celular1,
          cel2: safeData.celular2,
          cel3: safeData.celular3,
          email: safeData.email, // CAMBIO mail -> email
          cuitcuil: safeData.cuitcuil,
          m2vendibles: safeData.m2Vendibles, // CAMBIO m2_vendibles -> m2vendibles
          vventa: safeData.valorVentaUSD, // CAMBIO valor_venta_usd -> valorventausd
          inctasada: safeData.incidenciaTasadaUSD,
          fpago: safeData.formaDePago,
          fventa: safeData.fechaVenta ? safeData.fechaVenta.toISOString().split('T')[0] : null, // CAMBIO fechaventa -> fventa
        }),
      });
      if (res.ok) {
        setSuccess(true);
        toast({
          title: "Lote Actualizado",
          description: `Los datos del lote en ${listing?.address} han sido guardados.`,
        });
        setTimeout(() => {
          setSuccess(false);
          router.push(`/lotes/${listing?.smp}`);
        }, 1500);
      } else {
        const error = await res.json();
        toast({
          title: "Error al guardar",
          description: error.details || error.error || 'No se pudo actualizar el lote.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: "Error de red",
        description: 'No se pudo conectar con el servidor.',
        variant: 'destructive',
      });
    }
    setSaving(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {success && (
          <Alert variant="default">
            <AlertTitle>¡Lote actualizado!</AlertTitle>
            <AlertDescription>Los datos fueron guardados correctamente.</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <Link href={`/lotes/${listing.smp}`}>
                  <Button variant="outline" size="icon" type="button">
                      <ArrowLeft className="h-4 w-4" />
                  </Button>
              </Link>
              <div>
                  <h1 className="text-3xl font-bold tracking-tight">Editar Lote: {listing.address}</h1>
                  <p className="text-muted-foreground">{listing.neighborhood}</p>
              </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/lotes/${listing.smp}`}>
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Información Urbanística y Catastral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
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
                  <Scaling className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">Incidencia UVA:</span>
                  <span className="ml-auto text-muted-foreground">{listing.incidenciaUVA}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">FOT:</span>
                  <span className="ml-auto text-muted-foreground">{listing.fot}</span>
                </div>
                <div className="flex items-center">
                  <Percent className="h-5 w-5 mr-3 text-muted-foreground" />
                  <span className="font-medium">Alícuota:</span>
                  <span className="ml-auto text-muted-foreground">{listing.alicuota}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6 lg:col-span-2">
             <Card>
              <CardHeader>
                <CardTitle>Información del propietario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                  <FormField control={form.control} name="propietario" render={({ field }) => (
                    <FormItem><FormLabel>Propietario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="telefono1" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="direccionContacto" render={({ field }) => (
                    <FormItem><FormLabel>Dirección Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="telefono2" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="codigoPostal" render={({ field }) => (
                    <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="telefono3" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="localidad" render={({ field }) => (
                    <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="celular1" render={({ field }) => (
                    <FormItem><FormLabel>Celular 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="direccionAlternativa" render={({ field }) => (
                    <FormItem><FormLabel>Dirección Alternativa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="celular2" render={({ field }) => (
                    <FormItem><FormLabel>Celular 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="fallecido" render={({ field }) => (
                    <FormItem><FormLabel>Fallecido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="celular3" render={({ field }) => (
                    <FormItem><FormLabel>Celular 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="cuitcuil" render={({ field }) => (
                    <FormItem><FormLabel>CUIT/CUIL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
                 <div className="mt-4">
                  <FormField control={form.control} name="otrosDatos" render={({ field }) => (
                    <FormItem><FormLabel>Otros Datos</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Datos de Tasación</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
                     <FormField control={form.control} name="m2Vendibles" render={({ field }) => (
                      <FormItem><FormLabel>M2 Vendibles</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="valorVentaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Valor de Venta (USD)</FormLabel><FormControl><Input type="number" step="1000" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="incidenciaTasadaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Incidencia Tasada (USD/m2)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formaDePago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar forma de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Canje">Canje</SelectItem>
                            <SelectItem value="Cash/Canje">Cash/Canje</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fechaVenta"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Venta</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
