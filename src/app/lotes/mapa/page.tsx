'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

// Declaración de tipos para MapLibre GL
declare global {
  interface Window {
    maplibregl: any;
  }
}

import { getStatusStyles } from "@/lib/status-colors";

// Función para capitalizar nombres propios correctamente
const capitalizeProperNames = (str: string): string => {
  if (!str) return str;
  
  // Lista de palabras que no se capitalizan (excepto al inicio)
  const lowercaseWords = [
    'de', 'del', 'la', 'las', 'el', 'los', 'y', 'o', 'con', 'sin', 'por', 'para',
    'en', 'sobre', 'bajo', 'entre', 'tras', 'ante', 'desde', 'hasta', 'según',
    'contra', 'durante', 'mediante', 'excepto', 'salvo', 'según', 'vía'
  ];
  
  return str
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

const estados = [
  "Descartado", "Disponible", "Evolucionando", "No vende", "Reservado",
  "Tasación", "Tomar acción", "Vendido"
];

interface LoteInfo {
  smp: string;
  direccion: string;
  barrio: string;
  estado: string;
  agente: string;
  m2aprox: number;
  origen: string;
  propietario?: string;
  vventa?: number;
  m2vendibles?: number;
  inctasada?: number;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedBarrios, setSelectedBarrios] = useState<string[]>([]);
  const [basemap, setBasemap] = useState('carto');

  const [showVolumen, setShowVolumen] = useState(false);
  const [showTejido, setShowTejido] = useState(false);
  const [showLotes, setShowLotes] = useState(true);
  const [barrios, setBarrios] = useState<string[]>([]);
  const [barriosOriginales, setBarriosOriginales] = useState<string[]>([]);
  const [loadingBarrios, setLoadingBarrios] = useState(true);
  const [selectedLote, setSelectedLote] = useState<LoteInfo | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [loadingLote, setLoadingLote] = useState(false);

  // Cargar barrios desde la base de datos
  useEffect(() => {
    const fetchBarrios = async () => {
      try {
        const response = await fetch('/api/lotes/barrios');
        if (response.ok) {
          const data = await response.json();
          // Guardar los barrios originales de la base de datos
          const barriosOriginalesData = data.barrios || [];
          setBarriosOriginales(barriosOriginalesData);
          
          // Capitalizar los barrios para mostrar en la interfaz
          const barriosCapitalizados = barriosOriginalesData.map((barrio: string) => 
            capitalizeProperNames(barrio)
          );
          setBarrios(barriosCapitalizados);
          
          
          
          
          // Verificar algunos ejemplos de barrios
          if (barriosOriginalesData.length > 0) {
            
            
          }
        } else {
        }
      } catch (error) {
      } finally {
        setLoadingBarrios(false);
      }
    };

    fetchBarrios();
  }, []);

  // Función para crear la fuente WMS de lotes
  const createWmsSource = (estados: string[] = [], barriosCapitalizados: string[] = []) => {
    const filters = [];
    if (estados.length > 0) filters.push(`estado IN (${estados.map(e => `'${e}'`).join(',')})`);
    
    // Convertir barrios capitalizados a barrios originales para el filtro
    if (barriosCapitalizados.length > 0) {
      const barriosOriginalesParaFiltro = barriosCapitalizados.map(barrioCapitalizado => {
        // Buscar el índice del barrio capitalizado en el array de barrios capitalizados
        const index = barrios.findIndex(b => b === barrioCapitalizado);
        // Si se encuentra, usar el barrio original correspondiente
        if (index !== -1 && barriosOriginales[index]) {
          return barriosOriginales[index];
        }
        // Si no se encuentra, usar el barrio capitalizado tal como está
        return barrioCapitalizado;
      });
      
      
      
      
      filters.push(`barrio IN (${barriosOriginalesParaFiltro.map(b => `'${b}'`).join(',')})`);
    }
    
    const cql = filters.length ? `&CQL_FILTER=${encodeURIComponent(filters.join(' AND '))}` : '';
    
    
    
    return {
      type: 'raster',
      tiles: [
        'https://geo-epesege.com.ar/geoserver/prefapp/wms?' +
        'service=WMS&version=1.1.0&request=GetMap&layers=prefapp%3Alotes_geoserver&' +
        'styles=&format=image/png&transparent=true&srs=EPSG%3A3857&' +
        'bbox={bbox-epsg-3857}&width=256&height=256' + cql
      ],
      tileSize: 256
    };
  };

  // Función para actualizar la capa WMS de lotes
  const updateWmsLayer = () => {
    if (!map.current) return;
    
    if (map.current.getLayer('wms-lotes-layer')) {
      map.current.removeLayer('wms-lotes-layer');
    }
    if (map.current.getSource('wms-lotes')) {
      map.current.removeSource('wms-lotes');
    }
    
    if (showLotes) {
      map.current.addSource('wms-lotes', createWmsSource(selectedEstados, selectedBarrios));
      map.current.addLayer({
        id: 'wms-lotes-layer',
        type: 'raster',
        source: 'wms-lotes',
        paint: { 'raster-opacity': 1 }
      }, 'volumen_edificable');
    }
  };

  const handleMapClick = async (e: any) => {
    if (!map.current) return;

    // Obtener las coordenadas del clic
    const coordinates = e.lngLat;
    
    // Obtener el tamaño del contenedor del mapa
    const container = map.current.getContainer();
    const size = {
      width: container.offsetWidth,
      height: container.offsetHeight
    };
    
    // Obtener los límites del mapa
    const bounds = map.current.getBounds();
    
    // Calcular las coordenadas de píxeles del clic
    const point = map.current.project(coordinates);
    
    const getFeatureInfoUrl = `https://geo-epesege.com.ar/geoserver/prefapp/wms?` +
      `service=WMS&version=1.1.1&request=GetFeatureInfo&` +
      `layers=prefapp%3Alotes_geoserver&` +
      `query_layers=prefapp%3Alotes_geoserver&` +
      `info_format=application/json&` +
      `feature_count=1&` +
      `x=${Math.round(point.x)}&` +
      `y=${Math.round(point.y)}&` +
      `width=${size.width}&height=${size.height}&` +
      `srs=EPSG:4326&bbox=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    try {
      setLoadingLote(true);
      const response = await fetch(getFeatureInfoUrl);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const properties = feature.properties;
        
       
        
        const smp = properties.smp;
  
        
        // Si el SMP existe, obtener datos completos desde nuestra API
        if (smp && smp !== 'N/A') {
          
          try {
            // Obtener token de autenticación
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const headers: HeadersInit = {
              'Content-Type': 'application/json'
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            const apiResponse = await fetch(`/api/lotes/${smp}`, { headers });
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              
              // Convertir strings a números donde sea necesario
              const parseNumber = (value: any): number | undefined => {
                if (value === null || value === undefined || value === '') return undefined;
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? undefined : num;
              };
              
              const loteInfo: LoteInfo = {
                smp: apiData.lote.smp || smp,
                direccion: apiData.lote.address || properties.dir_lote || properties.direccion || 'Sin dirección',
                barrio: apiData.lote.neighborhood || properties.barrio || 'Sin barrio',
                estado: apiData.lote.status || properties.estado || 'Sin estado',
                agente: apiData.lote.agente || properties.agente || 'Sin agente',
                // Usar 'area' de la API o m2aprox de GeoServer
                m2aprox: parseNumber(apiData.lote.area) || parseNumber(apiData.lote.m2aprox) || properties.m2aprox || 0,
                origen: apiData.lote.origen || properties.origen || 'Sin origen',
                propietario: apiData.lote.propietario || properties.propietario,
                vventa: parseNumber(apiData.lote.vventa),
                m2vendibles: parseNumber(apiData.lote.m2vendibles),
                inctasada: parseNumber(apiData.lote.inctasada)
              };
              
              console.log('📦 Lote final:', loteInfo);
              setSelectedLote(loteInfo);
              setPopupOpen(true);
              return;
            }
          } catch (apiError) {
            console.error('❌ Error al obtener datos desde API:', apiError);
          }
        }
        
        // Fallback: usar datos de GeoServer
        const loteInfo: LoteInfo = {
          smp: properties.smp || 'N/A',
          direccion: properties.dir_lote || properties.direccion || 'Sin dirección',
          barrio: properties.barrio || 'Sin barrio',
          estado: properties.estado || 'Sin estado',
          agente: properties.agente || 'Sin agente',
          m2aprox: properties.m2aprox || 0,
          origen: properties.origen || 'Sin origen',
          propietario: properties.propietario,
          vventa: properties.vventa,
          m2vendibles: properties.m2vendibles || properties.m2_vendibles || properties.m2Vendibles,
          inctasada: properties.inctasada
        };
        
        setSelectedLote(loteInfo);
        setPopupOpen(true);
      }
    } catch (error) {
    } finally {
      setLoadingLote(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Cargar MapLibre GL CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css';
    document.head.appendChild(link);

    // Cargar MapLibre GL JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js';
    script.onload = () => {
      if (!mapContainer.current) return;

      map.current = new window.maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': { type: 'raster', tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 },
            'carto': { type: 'raster', tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'], tileSize: 256 },
            'satellite': { type: 'raster', tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 },
            'volumen_edif': { type: 'vector', tiles: ['https://vectortiles.usig.buenosaires.gob.ar/cur3d/volumen_edif/{z}/{x}/{y}.pbf?optimize=true'] },
            'tejido': { type: 'vector', tiles: ['https://vectortiles.usig.buenosaires.gob.ar/cur3d/tejido/{z}/{x}/{y}.pbf?optimize=true'] }
          },
          layers: [
            { id: 'carto-layer', type: 'raster', source: 'carto', layout: { visibility: 'visible' } },
            { id: 'osm-layer', type: 'raster', source: 'osm', layout: { visibility: 'none' } },
            { id: 'satellite-layer', type: 'raster', source: 'satellite', layout: { visibility: 'none' } },
            { id: 'volumen_edificable', type: 'fill-extrusion', source: 'volumen_edif', layout: { visibility: 'none' }, 'source-layer': 'default',
              paint: {
                'fill-extrusion-color': [
                  'match',
                  ['get', 'edificabil'],
                  'CA', '#667d8a',
                  'CM', '#92aaaf',
                  'USAA', '#d6a083',
                  'USAM', '#e6c294',
                  'USAB2', '#c6c294',
                  'USAB1', '#f3d30c',
                  'USAB0', '#FFD306', 
                  'APH', '#f9bcb4', 
                  'U', '#d1bbd0',
                  '#FFFFFF'
                ],
                'fill-extrusion-height': ['get', 'altura_fin'],
                'fill-extrusion-opacity': 0.8
              }
            },
            { id: 'tejido', type: 'fill-extrusion', source: 'tejido', layout: { visibility: 'none' }, 'source-layer': 'default','filter': ["all", [">=", ["get", "altura"], 1]],
              paint: {
                'fill-extrusion-color': '#ffffff',
                'fill-extrusion-height': ['get', 'altura'],
                'fill-extrusion-opacity': 0.8,
              }
            }
          ]
        },
        center: [-58.437, -34.61],
        zoom: 15
      });

      map.current.on('load', () => {
        map.current.addControl(new window.maplibregl.NavigationControl(), 'bottom-right');
        // Inicializar la capa WMS de lotes
        updateWmsLayer();
      });

      // Agregar evento de clic
      map.current.on('click', handleMapClick);
    };
    document.head.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Actualizar mapa base
  useEffect(() => {
    if (!map.current) return;
    
    ['carto-layer', 'osm-layer', 'satellite-layer'].forEach(layerId => {
      map.current.setLayoutProperty(layerId, 'visibility', layerId.startsWith(basemap) ? 'visible' : 'none');
    });
  }, [basemap]);

  // Actualizar capa de volumen
  useEffect(() => {
    if (!map.current) return;
    
    const visibility = showVolumen ? 'visible' : 'none';
    map.current.setLayoutProperty('volumen_edificable', 'visibility', visibility);
  }, [showVolumen]);

  // Actualizar capa de tejido
  useEffect(() => {
    if (!map.current) return;
    
    const visibility = showTejido ? 'visible' : 'none';
    map.current.setLayoutProperty('tejido', 'visibility', visibility);
  }, [showTejido]);

  // Actualizar capa WMS de lotes cuando cambien los filtros
  useEffect(() => {
    updateWmsLayer();
  }, [selectedEstados, selectedBarrios, showLotes]);

  const handleEstadoChange = (estado: string, checked: boolean) => {
    if (checked) {
      setSelectedEstados(prev => [...prev, estado]);
    } else {
      setSelectedEstados(prev => prev.filter(e => e !== estado));
    }
  };

  const handleBarrioChange = (barrio: string, checked: boolean) => {
    if (checked) {
      setSelectedBarrios(prev => [...prev, barrio]);
    } else {
      setSelectedBarrios(prev => prev.filter(b => b !== barrio));
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'No disponible';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatArea = (value: number | undefined | null) => {
    if (value === null || value === undefined) return 'No disponible';
    if (value === 0) return '0 m²';
    return `${value.toLocaleString('es-AR')} m²`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa de Lotes</h1>
        <p className="text-muted-foreground">Visualiza las propiedades en el mapa. Haz clic en un lote para ver más información.</p>
      </div> */}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de controles */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mapa base */}
            <div>
              <h4 className="font-semibold mb-3">Mapa base</h4>
              <RadioGroup value={basemap} onValueChange={setBasemap}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="carto" id="carto" />
                  <Label htmlFor="carto">Carto Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="osm" id="osm" />
                  <Label htmlFor="osm">OpenStreetMap</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satellite" id="satellite" />
                  <Label htmlFor="satellite">Imagen Satelital</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Capas adicionales */}
            <div>
              <h4 className="font-semibold mb-3">Capas</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lotes" 
                    checked={showLotes} 
                    onCheckedChange={(checked) => setShowLotes(checked as boolean)}
                  />
                  <Label htmlFor="lotes">Lotes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="volumen" 
                    checked={showVolumen} 
                    onCheckedChange={(checked) => setShowVolumen(checked as boolean)}
                  />
                  <Label htmlFor="volumen">Volumen edificable 3D</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="tejido" 
                    checked={showTejido} 
                    onCheckedChange={(checked) => setShowTejido(checked as boolean)}
                  />
                  <Label htmlFor="tejido">Tejido 3D</Label>
                </div>
              </div>
            </div>

            {/* Controles de vista 3D */}
            <div>
              <h4 className="font-semibold mb-3">Vista 3D</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (map.current) {
                        map.current.easeTo({
                          pitch: 0,
                          bearing: 0,
                          duration: 1000
                        });
                      }
                    }}
                  >
                    Vista 2D
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (map.current) {
                        map.current.easeTo({
                          pitch: 45,
                          bearing: 0,
                          duration: 1000
                        });
                      }
                    }}
                  >
                    Vista 3D
                  </Button>
                </div>
                

              </div>
            </div>

            {/* Estados */}
            <div>
              <h4 className="font-semibold mb-3">Estado</h4>
              <div className="flex flex-wrap gap-2">
                {estados.map(estado => (
                  <Badge 
                    key={estado}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleEstadoChange(estado, !selectedEstados.includes(estado))}
                    style={{
                      ...getStatusStyles(estado),
                      backgroundColor: selectedEstados.includes(estado) ? getStatusStyles(estado).backgroundColor : 'transparent',
                      color: selectedEstados.includes(estado) ? getStatusStyles(estado).color : getStatusStyles(estado).backgroundColor,
                      borderColor: getStatusStyles(estado).backgroundColor
                    }}
                  >
                    {estado}
                  </Badge>
                ))}
              </div>
              
              {/* Estados seleccionados */}
              {selectedEstados.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Estados seleccionados:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEstados.map(estado => (
                      <Badge 
                        key={estado}
                        className="cursor-pointer"
                        style={getStatusStyles(estado)}
                        onClick={() => handleEstadoChange(estado, false)}
                      >
                        {estado}
                        <span className="ml-1 text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Barrios */}
            <div>
              <h4 className="font-semibold mb-3">Barrios</h4>
              {loadingBarrios ? (
                <div className="text-sm text-muted-foreground">Cargando barrios...</div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {barrios.map(barrio => (
                    <div key={barrio} className="flex items-center space-x-2">
                      <Checkbox 
                        id={barrio}
                        checked={selectedBarrios.includes(barrio)}
                        onCheckedChange={(checked) => handleBarrioChange(barrio, checked as boolean)}
                      />
                      <Label htmlFor={barrio} className="text-sm">{barrio}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card className="lg:col-span-3">
          <CardContent>
            <div 
              ref={mapContainer} 
              className="h-[70vh] mt-5 w-full rounded-lg relative"
              style={{ minHeight: '730px' }}
            >
              {loadingLote && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-sm">Cargando información del lote...</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popup de información del lote */}
      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedLote?.estado ? getStatusStyles(selectedLote.estado).backgroundColor : '#ccc' }}></div>
              Información del Lote
            </DialogTitle>
          </DialogHeader>
          
          {selectedLote && (
            <div className="space-y-4">
              {/* Información principal */}
              <div>
                <h3 className="font-semibold text-lg">{selectedLote.direccion}</h3>
                <p className="text-muted-foreground">{selectedLote.barrio}</p>
              </div>

              <Separator />

              {/* Datos básicos */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">SMP:</span>
                  <p className="text-muted-foreground">{selectedLote.smp}</p>
                </div>
                <div>
                  <span className="font-medium">Estado:</span>
                  <p className="text-muted-foreground">{selectedLote.estado}</p>
                </div>
                <div>
                  <span className="font-medium">Agente:</span>
                  <p className="text-muted-foreground">{selectedLote.agente || 'Sin asignar'}</p>
                </div>
                <div>
                  <span className="font-medium">Origen:</span>
                  <p className="text-muted-foreground">{selectedLote.origen}</p>
                </div>
                <div>
                  <span className="font-medium">Superficie:</span>
                  <p className="text-muted-foreground">{formatArea(selectedLote.m2aprox)}</p>
                </div>
                <div>
                  <span className="font-medium">m² Vendibles:</span>
                  <p className="text-muted-foreground">{formatArea(selectedLote.m2vendibles)}</p>
                </div>
              </div>

              {/* Información de tasación */}
              {(selectedLote.vventa || selectedLote.inctasada) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Tasación</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Valor Venta:</span>
                        <p className="text-muted-foreground">{formatCurrency(selectedLote.vventa)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Incidencia Tasada:</span>
                        <p className="text-muted-foreground">{formatCurrency(selectedLote.inctasada)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Propietario */}
              {selectedLote.propietario && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">Propietario:</span>
                    <p className="text-muted-foreground">{selectedLote.propietario}</p>
                  </div>
                </>
              )}

              {/* Botón para ver más detalles */}
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setPopupOpen(false);
                    // Aquí podrías navegar a la página de detalles del lote
                    window.open(`/lotes/${selectedLote.smp}`, '_blank');
                  }}
                >
                  Ver detalles completos
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
