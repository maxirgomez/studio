import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

interface LotesFiltersProps {
  origenFilters: string[];
  statusFilters: string[];
  neighborhoodFilters: string[];
  agentFilters: string[];
  tipoFilters: string[];
  esquinaFilters: string[];
  uniqueOrigens: string[];
  uniqueStatuses: string[];
  uniqueNeighborhoods: string[];
  uniqueTipos: string[];
  uniqueAgents: { user: string; nombre: string; apellido: string; foto_perfil: string | null; iniciales: string }[];
  users: any[];
  sliderValue: [number, number];
  minArea: number;
  maxArea: number;
  areaInput: [string, string];
  frenteSliderValue: [number, number];
  minFrente: number;
  maxFrente: number;
  frenteInput: [string, string];
  handleMultiSelectFilterChange: (key: string, value: string) => void;
  handleAreaInputChange: (index: 0 | 1, value: string) => void;
  handleAreaInputBlur: () => void;
  handleSliderVisualChange: (newRange: [number, number]) => void;
  handleSliderFilterCommit: (newRange: [number, number]) => void;
  handleFrenteInputChange: (index: 0 | 1, value: string) => void;
  handleFrenteInputBlur: () => void;
  handleFrenteSliderVisualChange: (newRange: [number, number]) => void;
  handleFrenteSliderFilterCommit: (newRange: [number, number]) => void;
  activeFilters: { type: string; value: string; key: string }[];
  handleRemoveFilter: (key: string, value: string) => void;
  // Nuevas props para ordenamiento
  sortOrder?: 'asc' | 'desc';
  onSortOrderToggle?: () => void;
  // Prop para el usuario actual
  currentUser?: any;
}

const LotesFilters: React.FC<LotesFiltersProps> = ({
  origenFilters,
  statusFilters,
  neighborhoodFilters,
  agentFilters,
  tipoFilters,
  esquinaFilters,
  uniqueOrigens,
  uniqueStatuses,
  uniqueNeighborhoods,
  uniqueTipos,
  uniqueAgents,
  users,
  sliderValue,
  minArea,
  maxArea,
  areaInput,
  frenteSliderValue,
  minFrente,
  maxFrente,
  frenteInput,
  handleMultiSelectFilterChange,
  handleAreaInputChange,
  handleAreaInputBlur,
  handleSliderVisualChange,
  handleSliderFilterCommit,
  handleFrenteInputChange,
  handleFrenteInputBlur,
  handleFrenteSliderVisualChange,
  handleFrenteSliderFilterCommit,
  activeFilters,
  handleRemoveFilter,
  // Nuevas props para ordenamiento
  sortOrder,
  onSortOrderToggle,
  // Prop para el usuario actual
  currentUser,
}) => (
  <Card>
    <CardContent className="pt-5 space-y-6">
      <div className="space-y-2">
        <Label>Origen</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{origenFilters.length > 0 ? `${origenFilters.length} seleccionados` : "Origenes"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px]">
            <DropdownMenuLabel>Filtrar por Origen</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueOrigens.map((origen) => (
              <DropdownMenuCheckboxItem
                key={origen}
                checked={origenFilters.includes(origen)}
                onCheckedChange={() => handleMultiSelectFilterChange('origen', origen)}
              >
                {origen}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Estado</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{statusFilters.length > 0 ? `${statusFilters.length} seleccionados` : "Estados"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px]">
            <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilters.includes(status)}
                onCheckedChange={() => handleMultiSelectFilterChange('status', status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Barrio</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{neighborhoodFilters.length > 0 ? `${neighborhoodFilters.length} seleccionados` : "Barrios"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px] max-h-[200px] overflow-y-auto">
            <DropdownMenuLabel>Filtrar por Barrio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueNeighborhoods.map((neighborhood) => (
              <DropdownMenuCheckboxItem
                key={neighborhood}
                checked={neighborhoodFilters.includes(neighborhood)}
                onCheckedChange={() => handleMultiSelectFilterChange('neighborhood', neighborhood)}
              >
                {neighborhood}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Agente</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{agentFilters.length > 0 ? `${agentFilters.length} seleccionados` : "Agentes"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px] max-h-[200px] overflow-y-auto">
            <DropdownMenuLabel>Filtrar por Agente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueAgents.map((agente) => {
              const isCurrentUser = currentUser?.user === agente.user;
              const displayName = `${agente.nombre} ${agente.apellido}${isCurrentUser ? ' (yo)' : ''}`;
              return (
                <DropdownMenuCheckboxItem
                  key={agente.user}
                  checked={agentFilters.includes(agente.user)}
                  onCheckedChange={() => handleMultiSelectFilterChange('agent', agente.user)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={agente.foto_perfil || ''} alt={`Foto de ${agente.nombre} ${agente.apellido}`} />
                      <AvatarFallback className="text-xs">
                        {typeof agente.iniciales === 'string' ? agente.iniciales : (agente.nombre?.[0] || agente.apellido?.[0] || '?')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{displayName}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{tipoFilters.length > 0 ? `${tipoFilters.length} seleccionados` : "Tipos"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px]">
            <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueTipos.map((tipo) => (
              <DropdownMenuCheckboxItem
                key={tipo}
                checked={tipoFilters.includes(tipo)}
                onCheckedChange={() => handleMultiSelectFilterChange('tipo', tipo)}
              >
                {tipo}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <Label>Ubicado en Esquina</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{esquinaFilters.length > 0 ? `${esquinaFilters.length} seleccionados` : "Esquina"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px]">
            <DropdownMenuLabel>Filtrar por Esquina</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={esquinaFilters.includes('Si')}
              onCheckedChange={() => handleMultiSelectFilterChange('esquina', 'Si')}
            >
              Sí
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={esquinaFilters.includes('No')}
              onCheckedChange={() => handleMultiSelectFilterChange('esquina', 'No')}
            >
              No
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>M² Estimados: {sliderValue[0]} - {sliderValue[1]}m²</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={onSortOrderToggle}
            className="h-8 w-8 p-0"
            title={sortOrder === 'asc' ? 'Ordenar de menor a mayor' : 'Ordenar de mayor a menor'}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={areaInput[0]}
            min={minArea}
            max={maxArea}
            onChange={(e) => handleAreaInputChange(0, e.target.value)}
            onBlur={handleAreaInputBlur}
          />
          <Input
            type="number"
            placeholder="Max"
            value={areaInput[1]}
            min={minArea}
            max={maxArea}
            onChange={(e) => handleAreaInputChange(1, e.target.value)}
            onBlur={handleAreaInputBlur}
          />
        </div>
        <Slider
          value={sliderValue}
          onValueChange={handleSliderVisualChange}
          onValueCommit={handleSliderFilterCommit}
          min={minArea}
          max={maxArea}
          step={10}
        />
      </div>
      <div className="space-y-4">
        <Label>Ancho de Frente: {frenteSliderValue[0]} - {frenteSliderValue[1]}m</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={frenteInput[0]}
            min={minFrente}
            max={maxFrente}
            onChange={(e) => handleFrenteInputChange(0, e.target.value)}
            onBlur={handleFrenteInputBlur}
          />
          <Input
            type="number"
            placeholder="Max"
            value={frenteInput[1]}
            min={minFrente}
            max={maxFrente}
            onChange={(e) => handleFrenteInputChange(1, e.target.value)}
            onBlur={handleFrenteInputBlur}
          />
        </div>
        <Slider
          value={frenteSliderValue}
          onValueChange={handleFrenteSliderVisualChange}
          onValueCommit={handleFrenteSliderFilterCommit}
          min={minFrente}
          max={maxFrente}
          step={0.5}
        />
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start gap-2 pt-4 border-t">
      <Label className="font-semibold">Filtros Activos:</Label>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <Badge key={`${filter.key}-${filter.value}`} variant="secondary" className="flex items-center gap-1.5 pl-2">
              <span>
                {filter.type}: {filter.key === 'agent'
                  ? (uniqueAgents.find(a => a.user === filter.value)?.nombre + ' ' + uniqueAgents.find(a => a.user === filter.value)?.apellido)
                  : filter.value}
              </span>
              <button onClick={() => handleRemoveFilter(filter.key, filter.value)} className="rounded-full p-0.5 text-muted-foreground hover:bg-background/50 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ningún filtro aplicado.</p>
      )}
    </CardFooter>
  </Card>
);

export default LotesFilters; 