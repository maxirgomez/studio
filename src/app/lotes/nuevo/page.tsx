
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import { users, listings } from "@/lib/data"

const newLoteFormSchema = z.object({
  smp: z.string().min(1, "SMP es requerido."),
  address: z.string().min(3, "La dirección es requerida."),
  neighborhood: z.string().min(1, "El barrio es requerido."),
  area: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().positive("El área debe ser un número positivo.")),
  codigoUrbanistico: z.string().optional(),
  cpu: z.string().optional(),
  partida: z.string().optional(),
  origen: z.string().min(1, "El origen es requerido."),
  agent: z.string().min(1, "El agente es requerido."),
  status: z.string().min(1, "El estado es requerido."),
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
      smp: "",
      address: "",
      neighborhood: "",
      area: 0,
      codigoUrbanistico: "",
      cpu: "",
      partida: "",
      origen: "",
      agent: "",
      status: ""
    },
    mode: "onChange",
  });

  function onSubmit(data: NewLoteFormValues) {
    console.log(data);
    toast({
      title: "Lote Creado",
      description: `El nuevo lote en ${data.address} ha sido creado exitosamente.`,
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
              <p className="text-muted-foreground">Complete los detalles para agregar un nuevo lote al sistema.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/lotes">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit">Crear Lote</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información Principal</CardTitle>
            <CardDescription>Datos básicos y de ubicación del lote.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
              <FormField control={form.control} name="smp" render={({ field }) => (
                <FormItem>
                  <FormLabel>SMP (Sección-Manzana-Parcela)</FormLabel>
                  <FormControl><Input placeholder="Ej: 017-027-020A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl><Input placeholder="Ej: Av. Santa Fe 1060" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="neighborhood" render={({ field }) => (
                <FormItem>
                  <FormLabel>Barrio</FormLabel>
                  <FormControl><Input placeholder="Ej: Palermo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="area" render={({ field }) => (
                <FormItem>
                  <FormLabel>M² Estimados</FormLabel>
                  <FormControl><Input type="number" placeholder="Ej: 110" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Información Urbanística y de Gestión</CardTitle>
             <CardDescription>Detalles catastrales y de asignación interna.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-2">
               <FormField control={form.control} name="codigoUrbanistico" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Urbanístico</FormLabel>
                  <FormControl><Input placeholder="Ej: U.S.A.M." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="cpu" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPU</FormLabel>
                  <FormControl><Input placeholder="Ej: R2b1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="partida" render={({ field }) => (
                <FormItem>
                  <FormLabel>Partida</FormLabel>
                  <FormControl><Input placeholder="Ej: 123456-7" {...field} /></FormControl>
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
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
