
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
import { useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useUser } from "@/context/UserContext"

// Función helper para formatear altura
function formatAltura(altura: string | number): string {
  const str = String(altura);
  // Si es un número decimal como "913.0", mostrar solo "913"
  if (str.includes('.0')) {
    return str.replace(/\.0*$/, '');
  }
  return str;
}

// Función helper para capitalizar nombres propios correctamente
function capitalizeFirst(str: string): string {
  if (!str) return str;
  
  // Lista de palabras que no se capitalizan (excepto al inicio)
  const lowercaseWords = [
    'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'con', 'sin', 'por', 'para',
    'en', 'sobre', 'bajo', 'entre', 'tras', 'ante', 'desde', 'hasta', 'según',
    'contra', 'durante', 'mediante', 'excepto', 'salvo', 'según', 'vía'
  ];
  
  // Función para capitalizar una sola calle
  const capitalizeStreet = (street: string) => {
    return street
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        // Siempre capitalizar la primera palabra
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        
        // Capitalizar si no está en la lista de palabras que van en minúscula
        if (!lowercaseWords.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        
        return word;
      })
      .join(' ');
  };
  
  // Dividir por comas y capitalizar cada calle por separado
  return str
    .split(',')
    .map(street => capitalizeStreet(street.trim()))
    .join(', ');
}

// Hook personalizado para detectar cuando el usuario termina de escribir
function useTypingComplete<T>(value: T, minLength: number = 3, isNumeric: boolean = false): { value: T; triggerSearch: () => void; isTyping: boolean } {
  const [completedValue, setCompletedValue] = useState<T>(value);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const triggerSearch = useCallback(() => {
    setCompletedValue(value);
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [value]);

  useEffect(() => {
    const stringValue = String(value).trim();

    if (stringValue.length >= minLength) {
      setIsTyping(true);

      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      let delay = 600; // Delay por defecto

      if (isNumeric) {
        // Para números, usar un delay más corto y no depender de puntuación
        delay = 300; // 300ms para números
      } else {
        // Para texto, usar la lógica original
        const hasEndingPunctuation = /[.,;!?]/.test(stringValue);
        const hasSpace = stringValue.includes(' ');
        delay = hasEndingPunctuation ? 100 : (hasSpace ? 200 : 600);
      }

      console.log(`⏱️ useTypingComplete - Valor: "${stringValue}", Tipo: ${isNumeric ? 'numérico' : 'texto'}, Delay: ${delay}ms`);

      timeoutRef.current = setTimeout(() => {
        console.log(`✅ useTypingComplete completado - Valor: "${stringValue}"`);
        setCompletedValue(value);
        setIsTyping(false);
      }, delay);
    } else {
      setIsTyping(false);
      setCompletedValue(value);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, minLength, isNumeric]);

  return { value: completedValue, triggerSearch, isTyping };
}


const newLoteFormSchema = z.object({
  // Informacion del Lote
  frente: z.string().optional(), // Ya no es requerido por la API
  numero: z.string().optional(),
  smp: z.string().min(1, "SMP es requerido."),
  agent: z.string().min(1, "El agente es requerido."),
  status: z.string().min(1, "El estado es requerido."),
  origen: z.string().min(1, "El origen es requerido."),

  // Informacion Normativa
  codigoUrbanistico: z.string().optional(),
  neighborhood: z.string().optional(), // Ya no es requerido, se asigna valor por defecto
  m2aprox: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  superficieParcela: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  cpu: z.string().optional(),
  partida: z.string().optional(),
  incidenciaUVA: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  fot: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  alicuota: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),

  // Informacion del propietario
  propietario: z.string().optional(), // Ya no es requerido, se puede editar después
  direccionContacto: z.string().optional(), // Ya no es requerido, se asigna valor por defecto
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
  cuitcuil: z.string().optional(),
  email: z.string().email("Email inválido.").or(z.literal("")).optional(),

  // Tasacion
  m2Vendibles: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  valorVentaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  incidenciaTasadaUSD: z.preprocess(val => Number(String(val).replace(",", ".")), z.number().min(0, "Debe ser un número positivo.")).optional(),
  formaDePago: z.string().optional(), // Ya no es requerido por la API
  fechaVenta: z.date().optional(),
});


type NewLoteFormValues = z.infer<typeof newLoteFormSchema>;

// Función helper para verificar si el usuario puede ver información del propietario
function canViewOwnerInfo(currentUser: any): boolean {
  // Solo administradores pueden crear lotes con información del propietario
  return currentUser?.rol === 'Administrador';
}

export default function NuevoLotePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  // Estados para datos dinámicos
  const [agentes, setAgentes] = useState<any[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [origens, setOrigens] = useState<string[]>([]);
  const [calleSugerencias, setCalleSugerencias] = useState<string[]>([]);
  const [mostrarCalleSug, setMostrarCalleSug] = useState(false);
  const [numeroSugerencias, setNumeroSugerencias] = useState<string[]>([]);
  const [mostrarNumeroSug, setMostrarNumeroSug] = useState(false);
  const [smpEditable, setSmpEditable] = useState(false);
  const [loadingCalle, setLoadingCalle] = useState(false);
  const [loadingNumero, setLoadingNumero] = useState(false);
  const [loadingSMP, setLoadingSMP] = useState(false);
  const calleInputRef = useRef<HTMLInputElement>(null);
  const numeroInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch('/api/lotes/agentes').then(res => res.json()).then(data => setAgentes(data.agentes || []));
    fetch('/api/lotes/estados').then(res => res.json()).then(data => setEstados(data.estados || []));
    fetch('/api/lotes/origenes').then(res => res.json()).then(data => setOrigens(data.origenes || []));
  }, []);

  const form = useForm<NewLoteFormValues>({
    resolver: zodResolver(newLoteFormSchema),
    defaultValues: {
      frente: "",
      numero: "",
      smp: "",
      agent: "",
      status: "Tomar Acción",
      origen: "",
      codigoUrbanistico: "",
      neighborhood: "",
      m2aprox: 0,
      superficieParcela: 0,
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
      cuitcuil: "",
      email: "",
      m2Vendibles: 0,
      valorVentaUSD: 0,
      incidenciaTasadaUSD: 0,
      formaDePago: "Efectivo",
      fechaVenta: undefined,
    },
    mode: "onChange",
  });

  const frenteValue = form.watch("frente");
  const numeroValue = form.watch("numero");

  // Aplicar detección de escritura completa a los valores de búsqueda
  const frenteTyping = useTypingComplete(frenteValue || '', 3, false);
  const numeroTyping = useTypingComplete(numeroValue || '', 1, true);
  const completedFrenteValue = frenteTyping.value || '';
  const completedNumeroValue = numeroTyping.value || '';

  // Sugerencias de calle con detección de escritura completa
  useEffect(() => {
    const query = completedFrenteValue.trim();
    if (query.length >= 3) {
      setLoadingCalle(true);
      fetch(`/api/lotes/buscar?frente=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          // La API ahora devuelve directamente las calles únicas para autocompletado
          const calles = data.lotes || [];
          setCalleSugerencias(calles);
          // Solo mostrar sugerencias si el valor actual no está en la lista
          setMostrarCalleSug(calles.length > 0 && !calles.includes(query));
          setLoadingCalle(false);
        })
        .catch(() => setLoadingCalle(false));
    } else {
      setCalleSugerencias([]);
      setMostrarCalleSug(false);
      setLoadingCalle(false);
    }
  }, [completedFrenteValue]);

  // Actualizar mostrarCalleSug cuando cambie frenteValue
  useEffect(() => {
    if (calleSugerencias.length > 0) {
      // Solo mostrar sugerencias de calle si no hay focus en el campo número
      const numeroInputHasFocus = document.activeElement === numeroInputRef.current;
      if (!numeroInputHasFocus) {
        setMostrarCalleSug(!calleSugerencias.includes(completedFrenteValue));
      }
    }
  }, [completedFrenteValue, calleSugerencias]);

  // Sugerencias de número - DESHABILITADO
  // useEffect(() => {
  //   const calle = completedFrenteValue.trim();
  //   if (calle && calle.length > 0) {
  //     setLoadingNumero(true);
  //     // Usar un parámetro especial para indicar que queremos números
  //     fetch(`/api/lotes/buscar?frente=${encodeURIComponent(calle)}&numero=`)
  //       .then(res => res.json())
  //       .then(data => {
  //         // La API ahora devuelve directamente los números únicos para autocompletado
  //         const numeros = data.lotes || [];
  //         setNumeroSugerencias(numeros);
  //         setLoadingNumero(false);
  //       })
  //       .catch(() => setLoadingNumero(false));
  //   } else {
  //     setNumeroSugerencias([]);
  //     setLoadingNumero(false);
  //   }
  // }, [completedFrenteValue]);

  // Filtrar sugerencias de número en tiempo real - DESHABILITADO
  // const numeroSugerenciasFiltradas = numeroSugerencias.filter(num => {
  //   if (!numeroValue) return true;

  //   // Normalizar el número ingresado (remover comas y decimales)
  //   const cleanInput = numeroValue.replace(/,/g, '').replace(/\.0*$/, '');

  //   // Normalizar el número de la sugerencia (remover comas y decimales)
  //   const cleanSuggestion = String(num).replace(/,/g, '').replace(/\.0*$/, '');

  //   return cleanSuggestion.includes(cleanInput);
  // });

  // Mostrar sugerencias de número si hay calle seleccionada y hay sugerencias filtradas - DESHABILITADO
  // const mostrarNumeroSugerencias = completedFrenteValue.trim() && numeroSugerenciasFiltradas.length > 0;

  // Autocomplete SMP y datos normativos
  useEffect(() => {
    const searchFrente = completedFrenteValue.trim();
    const searchNumero = completedNumeroValue.trim();
    
    console.log('🔍 Búsqueda SMP - Frente:', searchFrente, 'Número:', searchNumero);
    
    setSmpEditable(false);
    if (searchFrente && searchNumero) {
      setLoadingSMP(true);
      const params = new URLSearchParams({ frente: searchFrente, num_dom: searchNumero });
      const url = `/api/lotes/buscar?${params.toString()}`;
      console.log('🔍 URL de búsqueda:', url);
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('🔍 Respuesta de la API:', data);
          if (data.found && data.lotes.length > 0) {
            const lote = data.lotes[0];
            console.log('✅ Lote encontrado:', lote);
            form.setValue('smp', lote.smp || '', { shouldValidate: true });
            form.setValue('neighborhood', lote.barrio || '', { shouldValidate: true });
            form.setValue('partida', lote.partida || '', { shouldValidate: true });
            form.setValue('m2aprox', lote.m2_estimados || 0, { shouldValidate: true });
            form.setValue('superficieParcela', lote.sup_parcela || 0, { shouldValidate: true });
            form.setValue('codigoUrbanistico', lote.codigoUrbanistico || '', { shouldValidate: true });
            form.setValue('cpu', lote.cpu || '', { shouldValidate: true });
            form.setValue('incidenciaUVA', lote.incidenciaUVA || 0, { shouldValidate: true });
            form.setValue('fot', lote.fot || 0, { shouldValidate: true });
            form.setValue('alicuota', lote.alicuota || 0, { shouldValidate: true });
            
            // Asegurar que la dirección se guarde correctamente
            const direccionReal = `${searchFrente} ${searchNumero}`.trim();
            form.setValue('direccionContacto', direccionReal, { shouldValidate: false });
            
            setSmpEditable(false);
          } else {
            console.log('❌ No se encontró lote para:', searchFrente, searchNumero);
            form.setValue('smp', '', { shouldValidate: false });
            setSmpEditable(true);
          }
          setLoadingSMP(false);
        })
        .catch((error) => {
          console.error('❌ Error en búsqueda SMP:', error);
          setLoadingSMP(false);
        });
    } else {
      console.log('⚠️ Faltan datos para búsqueda - Frente:', searchFrente, 'Número:', searchNumero);
      form.setValue('smp', '', { shouldValidate: false });
      setSmpEditable(false);
      setLoadingSMP(false);
    }
  }, [completedFrenteValue, completedNumeroValue, form]);

  // Función para limpiar campos numéricos
  function cleanNumericField(value: any): number | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  async function onSubmit(data: NewLoteFormValues) {
    
    
    try {
      // Construir la dirección real a partir de calle y número
      const direccionReal = `${data.frente || ''} ${data.numero || ''}`.trim();
      
      // Validación adicional: asegurar que siempre se use la dirección correcta
      if (!direccionReal) {
        toast({
          title: "Error en la dirección",
          description: "La dirección no puede estar vacía. Por favor, ingresa calle y número.",
          variant: 'destructive',
        });
        return;
      }
      
      
      
      // Preparar los datos para la API según el mapeo de campos
      const loteData = {
        // Información del Lote (solo estos 4 son realmente requeridos)
        smp: data.smp,
        agente: data.agent,
        estado: data.status,
        origen: data.origen,
        
        // Información Normativa (viene de la búsqueda automática o valores por defecto)
        cur: data.codigoUrbanistico || null,
        barrio: data.neighborhood || "Sin especificar", // Valor por defecto si está vacío
        m2aprox: cleanNumericField(data.m2aprox) || 0, // Valor por defecto si está vacío
        sup_parcela: cleanNumericField(data.superficieParcela) || 0,
        dist_cpu_1: data.cpu || null,
        partida: data.partida || null,
        inc_uva: cleanNumericField(data.incidenciaUVA) || 0,
        fot: cleanNumericField(data.fot) || 0,
        alicuota: cleanNumericField(data.alicuota) || 0,
        
        // Información del Propietario (se puede editar después)
        propietario: data.propietario || "Sin especificar", // Valor por defecto si está vacío
        direccion: direccionReal, // SIEMPRE usar la dirección real
        direccionalt: data.direccionAlternativa || null,
        localidad: data.localidad || null,
        cp: data.codigoPostal || null,
        email: data.email || null,
        fallecido: data.fallecido || "No",
        tel1: cleanNumericField(data.telefono1),
        tel2: cleanNumericField(data.telefono2),
        tel3: cleanNumericField(data.telefono3),
        cel1: cleanNumericField(data.celular1),
        cel2: cleanNumericField(data.celular2),
        cel3: cleanNumericField(data.celular3),
        cuitcuil: cleanNumericField(data.cuitcuil),
        otros: data.otrosDatos || null,
        
        // Datos de Tasación (se pueden editar después)
        m2vendibles: cleanNumericField(data.m2Vendibles),
        vventa: cleanNumericField(data.valorVentaUSD),
        inctasada: cleanNumericField(data.incidenciaTasadaUSD),
        fpago: data.formaDePago || null,
        fventa: data.fechaVenta ? data.fechaVenta.toISOString().split('T')[0] : null,
        
        // Generar automáticamente la URL de la foto del USIG
        foto_lote: `https://fotos.usig.buenosaires.gob.ar/getFoto?smp=${data.smp}`,
      };

      
      
      
      
      
      
      
      
      
      
      

      const response = await fetch('/api/lotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el lote');
      }

      const result = await response.json();
      

      const fullAddress = `${data.frente || ''} ${data.numero || ''}`.trim();
      toast({
        title: "Lote Creado",
        description: `El nuevo lote${fullAddress ? ` en ${fullAddress}` : ''} ha sido creado exitosamente.`,
      });
      
      router.push(`/lotes`);
    } catch (error) {
      console.error('Error al crear el lote:', error);
      toast({
        title: "Error al crear el lote",
        description: error instanceof Error ? error.message : 'No se pudo crear el lote.',
        variant: 'destructive',
      });
    }
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
                  <FormItem className="lg:col-span-2 relative">
                    <FormLabel>Calle</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          placeholder="Ej: Av. Santa Fe o SMP"
                          {...field}
                          ref={calleInputRef}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              frenteTyping.triggerSearch();
                            }
                          }}
                          onFocus={() => {
                            
                            
                            
                            // No cambiar el estado aquí, ya se maneja en useEffect
                          }}
                          onBlur={() => {
                            // Solo ocultar si el focus no va al campo número
                            setTimeout(() => {
                              const numeroInputHasFocus = document.activeElement === numeroInputRef.current;
                              if (!numeroInputHasFocus) {
                                setMostrarCalleSug(false);
                              }
                            }, 200);
                          }}
                        />
                        {loadingCalle && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Cargando...</div>
                          </div>
                        )}
                        {mostrarCalleSug && calleSugerencias.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            zIndex: 10,
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: 6,
                            marginTop: 2,
                            maxHeight: 300,
                            overflowY: calleSugerencias.length > 10 ? 'scroll' : 'auto',
                            width: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                          }}>
                            {calleSugerencias.slice(0, 10).map((calle, idx) => (
                              <div
                                key={calle}
                                style={{
                                  padding: '6px 12px',
                                  borderBottom: idx < Math.min(9, calleSugerencias.length - 1) ? '1px solid #f3f4f6' : 'none',
                                  cursor: 'pointer',
                                  background: frenteValue === calle ? '#f3f4f6' : 'white',
                                  fontSize: '14px',
                                  transition: 'background-color 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = frenteValue === calle ? '#f3f4f6' : 'white';
                                }}
                                onClick={() => {
                                  
                                  
                                  form.setValue('frente', calle, { shouldValidate: true });
                                  setMostrarCalleSug(false);
                                  
                                  // Asegurar que el dropdown de calle permanezca oculto
                                  setTimeout(() => {
                                    setMostrarCalleSug(false);
                                    numeroInputRef.current?.focus();
                                  }, 100);
                                }}
                              >
                                {capitalizeFirst(calle)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="numero" render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: 1060"
                          {...field}
                          ref={numeroInputRef}
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              numeroTyping.triggerSearch();
                            }
                          }}
                          onFocus={() => {
                            // Ocultar dropdown de calle cuando el campo número tiene focus
                            setMostrarCalleSug(false);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('🔍 Búsqueda manual activada');
                            numeroTyping.triggerSearch();
                            frenteTyping.triggerSearch();
                          }}
                          disabled={loadingSMP}
                        >
                          {loadingSMP ? 'Buscando...' : 'Buscar'}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="smp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMP</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          {...field}
                          readOnly={!smpEditable}
                          placeholder={smpEditable ? 'No existe SMP, ingrese uno nuevo' : ''}
                          style={smpEditable ? { background: '#fffbe6', border: '1px solid #facc15' } : {}}
                        />
                        {loadingSMP && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">Cargando...</div>
                          </div>
                        )}
                        {(frenteTyping.isTyping || numeroTyping.isTyping) && !loadingSMP && (
                          <div className="mt-2">
                            <div className="text-xs text-blue-600">Detectando escritura...</div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    {smpEditable && <div className="text-xs text-yellow-700 mt-1">No existe SMP para esa combinación. Ingrese uno nuevo.</div>}
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="agent" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agente Asignado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar agente..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agentes.map(agente => {
                          const isCurrentUser = user?.user === agente.user;
                          const nombreCompleto = agente.nombre && agente.apellido
                            ? `${agente.nombre} ${agente.apellido}${isCurrentUser ? ' (yo)' : ''}`
                            : agente.user || 'Sin nombre';
                          return (
                            <SelectItem key={agente.user} value={agente.user}>
                              {nombreCompleto}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estados.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="origen" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar origen..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {origens.map(origen => <SelectItem key={origen} value={origen}>{origen}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
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
                )} />
                <FormField control={form.control} name="neighborhood" render={({ field }) => (
                  <FormItem><FormLabel>Barrio</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="m2aprox" render={({ field }) => (
                  <FormItem><FormLabel>M² vendibles estimados</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="superficieParcela" render={({ field }) => (
                  <FormItem><FormLabel>Superficie de Parcela</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="cpu" render={({ field }) => (
                  <FormItem><FormLabel>CPU</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="partida" render={({ field }) => (
                  <FormItem><FormLabel>Partida</FormLabel><FormControl><Input {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="incidenciaUVA" render={({ field }) => (
                  <FormItem><FormLabel>Incidencia UVA</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="fot" render={({ field }) => (
                  <FormItem><FormLabel>FOT</FormLabel><FormControl><Input type="number" step="0.1" {...field} readOnly /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="alicuota" render={({ field }) => (
                  <FormItem><FormLabel>Alícuota (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} readOnly /></FormControl></FormItem>
                )} />
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
                )} />
                <FormField control={form.control} name="fallecido" render={({ field }) => (
                  <FormItem><FormLabel>Fallecido</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="Si">Sí</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="direccionContacto" render={({ field }) => (
                  <FormItem><FormLabel>Dirección Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="direccionAlternativa" render={({ field }) => (
                  <FormItem><FormLabel>Dirección Alternativa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="localidad" render={({ field }) => (
                  <FormItem><FormLabel>Localidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="codigoPostal" render={({ field }) => (
                  <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefono1" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefono2" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="celular1" render={({ field }) => (
                  <FormItem><FormLabel>Celular 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="celular2" render={({ field }) => (
                  <FormItem><FormLabel>Celular 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cuitcuil" render={({ field }) => (
                  <FormItem><FormLabel>CUIT/CUIL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="otrosDatos" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Seguimiento/Notas del lote</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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
                  <FormItem><FormLabel>M2 Vendibles Reales</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="valorVentaUSD" render={({ field }) => (
                  <FormItem><FormLabel>Valor de Venta (USD)</FormLabel><FormControl><Input type="number" step="1000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="incidenciaTasadaUSD" render={({ field }) => (
                  <FormItem><FormLabel>Incidencia Tasada (USD/m2)</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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
