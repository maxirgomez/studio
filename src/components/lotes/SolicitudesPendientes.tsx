"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, MapPin, Ruler, DollarSign, Clock } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface Solicitud {
  smp: string;
  direccion: string;
  barrio: string;
  estado: string;
  agente: string;
  m2aprox: number;
  vventa: number;
  usuarioSolicitante: string;
  usuarioInfo: {
    user: string;
    nombre: string;
    apellido: string;
    foto_perfil: string;
    iniciales: string;
  } | null;
}

interface SolicitudesPendientesProps {
  onSolicitudRespondida?: () => void;
}

export default function SolicitudesPendientes({ onSolicitudRespondida }: SolicitudesPendientesProps) {
  const { user: currentUser } = useUser();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      fetchSolicitudes();
    }
  }, [currentUser]);

  const fetchSolicitudes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/lotes/solicitudes-pendientes?agente=${currentUser.user}`);
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data.solicitudes || []);
      } else {
        setSolicitudes([]);
      }
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      setSolicitudes([]);
    }
    setLoading(false);
  };

  const responderSolicitud = async (smp: string, accion: 'aceptar' | 'rechazar') => {
    if (!currentUser) return;
    
    setRespondiendo(smp);
    try {
      const motivo = accion === 'rechazar' 
        ? 'Solicitud rechazada'
        : 'Solicitud aceptada';
      
      const res = await fetch(`/api/lotes/${smp}/solicitar/${currentUser.user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          agenteActual: currentUser.user,
          nuevoAgente: accion === 'aceptar' ? 'usuario_solicitante' : null,
          motivo
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: accion === 'aceptar' ? "Solicitud Aceptada" : "Solicitud Rechazada",
          description: `La solicitud ha sido ${accion === 'aceptar' ? 'aceptada' : 'rechazada'} correctamente.`,
        });
        
        // Remover la solicitud de la lista
        setSolicitudes(prev => prev.filter(s => s.smp !== smp));
        
        // Notificar al componente padre si es necesario
        if (onSolicitudRespondida) {
          onSolicitudRespondida();
        }
      } else {
        throw new Error(data.error || 'Error al procesar respuesta');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar la respuesta.",
      });
    }
    setRespondiendo(null);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitudes Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            Cargando solicitudes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (solicitudes.length === 0) {
    return null; // No mostrar el componente si no hay solicitudes
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Solicitudes Pendientes ({solicitudes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div key={solicitud.smp} className="border rounded-lg p-4 bg-muted/50 border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-8 w-8">
                      {solicitud.usuarioInfo?.foto_perfil ? (
                        <AvatarImage 
                          src={solicitud.usuarioInfo.foto_perfil} 
                          alt={`Foto de ${solicitud.usuarioInfo.nombre} ${solicitud.usuarioInfo.apellido}`} 
                        />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {solicitud.usuarioInfo?.iniciales || solicitud.usuarioSolicitante[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {solicitud.usuarioInfo 
                          ? `${solicitud.usuarioInfo.nombre} ${solicitud.usuarioInfo.apellido}`.trim()
                          : solicitud.usuarioSolicitante
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        solicita el lote
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-11">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{solicitud.direccion}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{solicitud.barrio}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        <span>{solicitud.m2aprox} m²</span>
                      </div>
                      {solicitud.vventa && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${solicitud.vventa.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        SMP: {solicitud.smp}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button 
                    size="sm" 
                    onClick={() => responderSolicitud(solicitud.smp, 'aceptar')}
                    disabled={respondiendo === solicitud.smp}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aceptar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => responderSolicitud(solicitud.smp, 'rechazar')}
                    disabled={respondiendo === solicitud.smp}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
