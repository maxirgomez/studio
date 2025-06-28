
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react"
import { users, listings } from "@/lib/data"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"


const newLoteFormSchema = z.object({
  // Informacion del Lote
  frente: z.string().min(1, "La calle es requerida."),
  numero: z.string().optional(),
  smp: z.string().min(1, "SMP es requerido."),
  agent: z.string().min(1, "El agente es requerido."),
  status: z.string().min(1, "El estado es requerido."),
  origen: z.string().min(1, "El origen es requerido."),
  
  // Informacion Normativa
  codigoUrbanistico: z.string().optional(),
  neighborhood: z.string(), 
  area: z.number(), 
  cpu: z.string().optional(),
  partida: z.string().optional(),
  incidenciaUVA: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  fot: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  alicuota: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  
  // Informacion del propietario
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

  // Tasacion
  m2Vendibles: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  valorVentaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  incidenciaTasadaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")),
  formaDePago: z.string().min(1, "La forma de pago es requerida."),
  fechaVenta: z.date().optional(),
});


type NewLoteFormValues = z.infer<typeof newLoteFormSchema>;

const uniqueStatuses = [...new Set(listings.map(l => l.status))];
const uniqueOrigens = [...new Set(listings.map(l => l.origen))];

export default function NuevoLotePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<NewLoteFormValues>({
    resolver: zodResolver(newLoteFormSchema),
    defaultValues: {
      frente: "",
      numero: "",
      smp: "",
      agent: "",
      status: "",
      origen: "",
      codigoUrbanistico: "",
      neighborhood: "",
      area: 0,
      cpu: "",
      partida: "",
      incidenciaUVA: 0,
      fot: 0,
      alicuota: 0,
      propietario: "",
      direccionContacto: "",
      codigoPostal: "",
      localidad: "",
      direccionAlternativa: "",
      fallecido: "No",
      otrosDatos: "",
      telefono1: "",
      telefono2: "",
      telefono3: "",
      celular1: "",
      celular2: "",
      celular3: "",
      email: "",
      m2Vendibles: 0,
      valorVentaUSD: 0,
      incidenciaTasadaUSD: 0,
      formaDePago: "",
      fechaVenta: undefined,
    },
    mode: "onChange",
  });

  const frenteValue = form.watch("frente");
  const numeroValue = form.watch("numero");

  useEffect(() => {
    const searchFrente = frenteValue.toLowerCase();
    const searchNumero = numeroValue?.toLowerCase() || '';
    const fullSearch = `${searchFrente} ${searchNumero}`.trim();
    
    if (searchFrente) {
      const foundListing = listings.find(l => 
        l.smp.toLowerCase() === searchFrente ||
        l.address.toLowerCase().includes(fullSearch)
      );

      if (foundListing) {
        form.setValue("smp", foundListing.smp, { shouldValidate: true });
        form.setValue("neighborhood", foundListing.neighborhood, { shouldValidate: true });
        form.setValue("partida", foundListing.partida || "", { shouldValidate: true });
        form.setValue("area", foundListing.area, { shouldValidate: true });
        form.setValue("codigoUrbanistico", foundListing.codigoUrbanistico || "", { shouldValidate: true });
        form.setValue("cpu", foundListing.cpu || "", { shouldValidate: true });
        form.setValue("incidenciaUVA", foundListing.incidenciaUVA || 0, { shouldValidate: true });
        form.setValue("fot", foundListing.fot || 0, { shouldValidate: true });
        form.setValue("alicuota", foundListing.alicuota || 0, { shouldValidate: true });
      } else {
        form.setValue("smp", "", { shouldValidate: false });
        form.setValue("neighborhood", "", { shouldValidate: false });
        form.setValue("partida", "", { shouldValidate: false });
        form.setValue("area", 0, { shouldValidate: false });
        form.setValue("codigoUrbanistico", "", { shouldValidate: false });
        form.setValue("cpu", "", { shouldValidate: false });
        form.setValue("incidenciaUVA", 0, { shouldValidate: false });
        form.setValue("fot", 0, { shouldValidate: false });
        form.setValue("alicuota", 0, { shouldValidate: false });
      }
    }
  }, [frenteValue, numeroValue, form]);

  function onSubmit(data: NewLoteFormValues) {
    console.log(data);
    const fullAddress = `${data.frente} ${data.numero || ''}`.trim();
    toast({
      title: "Lote Creado",
      description: `El nuevo lote en ${fullAddress} ha sido creado exitosamente.`,
    });
    router.push(`/lotes`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/lotes">
              <Button variant="outline" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Lote</h1>
              <p className="text-muted-foreground">Comience ingresando la calle para autocompletar los datos.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/lotes">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit">Crear Lote</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información del Lote</CardTitle>
                <CardDescription>Detalles principales y de gestión del lote.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                   <FormField control={form.control} name="frente" render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Calle</FormLabel>
                      <FormControl><Input placeholder="Ej: Av. Santa Fe o SMP" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="numero" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl><Input placeholder="Ej: 1060" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                   <FormField control={form.control} name="smp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMP</FormLabel>
                      <FormControl><Input {...field} readOnly /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="agent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agente Asignado</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar agente..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => <SelectItem key={user.email} value={user.name}>{user.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                   <FormField control={form.control} name="origen" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origen</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar origen..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {uniqueOrigens.map(origen => <SelectItem key={origen} value={origen}>{origen}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Información Normativa</CardTitle>
                    <CardDescription>Datos urbanísticos autocompletados a partir del SMP.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <FormField control={form.control} name="codigoUrbanistico" render={({ field }) => (
                            <FormItem><FormLabel>Código Urbanístico</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="neighborhood" render={({ field }) => (
                          <FormItem><FormLabel>Barrio</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="area" render={({ field }) => (
                          <FormItem><FormLabel>M² Estimados (Superficie de Parcela)</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="cpu" render={({ field }) => (
                            <FormItem><FormLabel>CPU</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="partida" render={({ field }) => (
                            <FormItem><FormLabel>Partida</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="incidenciaUVA" render={({ field }) => (
                            <FormItem><FormLabel>Incidencia UVA</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="fot" render={({ field }) => (
                            <FormItem><FormLabel>FOT</FormLabel><FormControl><Input type="number" step="0.1" {...field} readOnly /></FormControl></FormItem>
                        )}/>
                        <FormField control={form.control} name="alicuota" render={({ field }) => (
                            <FormItem><FormLabel>Alícuota (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly /></FormControl></FormItem>
                        )}/>
                    </div>
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Información del propietario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <FormField control={form.control} name="propietario" render={({ field }) => (
                    <FormItem><FormLabel>Propietario</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="fallecido" render={({ field }) => (
                      <FormItem><FormLabel>Fallecido</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Si">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="direccionContacto" render={({ field }) => (
                    <FormItem><FormLabel>Dirección Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="direccionAlternativa" render={({ field }) => (
                    <FormItem><FormLabel>Dirección Alternativa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="localidad" render={({ field }) => (
                    <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="codigoPostal" render={({ field }) => (
                    <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="telefono1" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="telefono2" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                   <FormField control={form.control} name="celular1" render={({ field }) => (
                    <FormItem><FormLabel>Celular 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="celular2" render={({ field }) => (
                    <FormItem><FormLabel>Celular 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="otrosDatos" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Otros Datos</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Datos de Tasación</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <FormField control={form.control} name="m2Vendibles" render={({ field }) => (
                      <FormItem><FormLabel>M2 Vendibles</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="valorVentaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Valor de Venta (USD)</FormLabel><FormControl><Input type="number" step="1000" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="incidenciaTasadaUSD" render={({ field }) => (
                      <FormItem><FormLabel>Incidencia Tasada (USD/m2)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="formaDePago"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma de Pago</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar forma de pago..." />
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
                        <FormItem className="flex flex-col pt-2">
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
      </form>
    </Form>
  )
}
