
"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from 'next/navigation'
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
import { ArrowLeft, MapPin, Scan, Ruler, Building, FileText, User, Home, Mailbox, Phone, Smartphone, Mail, Info, XCircle, Scaling, Percent, CreditCard, DollarSign, Library } from "lucide-react"
import { listings } from "@/lib/data"

const editLoteFormSchema = z.object({
  propietario: z.string().min(2, "El nombre es requerido."),
  direccionContacto: z.string(),
  codigoPostal: z.string(),
  localidad: z.string(),
  direccionAlternativa: z.string().optional(),
  fallecido: z.string(),
  otrosDatos: z.string().max(200, "Máximo 200 caracteres.").optional(),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  telefono3: z.string().optional(),
  celular1: z.string().optional(),
  celular2: z.string().optional(),
  celular3: z.string().optional(),
  email: z.string().email("Email inválido.").or(z.literal("")).optional(),
  
  incidenciaUVA: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  fot: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  alicuota: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  m2Vendibles: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  valorVentaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  incidenciaTasadaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  formaDePago: z.string().min(1, "La forma de pago es requerida."),
});

type EditLoteFormValues = z.infer<typeof editLoteFormSchema>;

export default function LoteEditPage() {
  const params = useParams<{ smp: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const listing = listings.find((l) => l.smp === params.smp);

  const form = useForm<EditLoteFormValues>({
    resolver: zodResolver(editLoteFormSchema),
    defaultValues: {
      propietario: "Juan Pérez",
      direccionContacto: "Calle Falsa 123",
      codigoPostal: "C1425",
      localidad: "Buenos Aires",
      direccionAlternativa: "Av. Siempreviva 742",
      fallecido: "No",
      otrosDatos: "Contactar solo por la mañana.",
      telefono1: "(011) 4555-5555",
      telefono2: "(011) 4666-6666",
      telefono3: "-",
      celular1: "(011) 15-1234-5678",
      celular2: "-",
      celular3: "-",
      email: "juan.perez@example.com",
      incidenciaUVA: 1.25,
      fot: 3.0,
      alicuota: 8.25,
      m2Vendibles: 555,
      valorVentaUSD: 1200000,
      incidenciaTasadaUSD: 2162,
      formaDePago: "A convenir",
    },
    mode: "onChange",
  });

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
  
  function onSubmit(data: EditLoteFormValues) {
    toast({
      title: "Lote Actualizado",
      description: `Los datos del lote en ${listing?.address} han sido guardados.`,
    });
    router.push(`/lotes/${listing?.smp}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit">Guardar Cambios</Button>
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
                    <FormField control={form.control} name="incidenciaUVA" render={({ field }) => (
                      <FormItem><FormLabel>Incidencia UVA</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="m2Vendibles" render={({ field }) => (
                      <FormItem><FormLabel>M2 Vendibles</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="fot" render={({ field }) => (
                      <FormItem><FormLabel>FOT</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="valorVentaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Valor de Venta (USD)</FormLabel><FormControl><Input type="number" step="1000" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="alicuota" render={({ field }) => (
                      <FormItem><FormLabel>Alícuota (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="incidenciaTasadaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Incidencia Tasada (USD/m2)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                 </div>
                 <div className="mt-4">
                  <FormField control={form.control} name="formaDePago" render={({ field }) => (
                    <FormItem><FormLabel>Forma de Pago</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
