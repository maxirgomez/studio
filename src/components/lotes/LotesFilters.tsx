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
import { X, ChevronDown } from "lucide-react";
import React from "react";

interface LotesFiltersProps {
  origenFilters: string[];
  statusFilters: string[];
  neighborhoodFilters: string[];
  agentFilters: string[];
  uniqueOrigens: string[];
  uniqueStatuses: string[];
  uniqueNeighborhoods: string[];
  uniqueAgents: string[];
  users: any[];
  sliderValue: [number, number];
  minArea: number;
  maxArea: number;
  areaInput: [string, string];
  handleMultiSelectFilterChange: (key: string, value: string) => void;
  handleAreaInputChange: (index: 0 | 1, value: string) => void;
  handleAreaInputBlur: () => void;
  handleSliderVisualChange: (newRange: [number, number]) => void;
  handleSliderFilterCommit: (newRange: [number, number]) => void;
  activeFilters: { type: string; value: string; key: string }[];
  handleRemoveFilter: (key: string, value: string) => void;
}

const LotesFilters: React.FC<LotesFiltersProps> = ({
  origenFilters,
  statusFilters,
  neighborhoodFilters,
  agentFilters,
  uniqueOrigens,
  uniqueStatuses,
  uniqueNeighborhoods,
  uniqueAgents,
  users,
  sliderValue,
  minArea,
  maxArea,
  areaInput,
  handleMultiSelectFilterChange,
  handleAreaInputChange,
  handleAreaInputBlur,
  handleSliderVisualChange,
  handleSliderFilterCommit,
  activeFilters,
  handleRemoveFilter,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Filtrar Lotes</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
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
          <DropdownMenuContent className="w-[250px]">
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
          <DropdownMenuContent className="w-[250px]">
            <DropdownMenuLabel>Filtrar por Agente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueAgents.map((agente) => (
              <DropdownMenuCheckboxItem
                key={agente}
                checked={agentFilters.includes(agente)}
                onCheckedChange={() => handleMultiSelectFilterChange('agent', agente)}
              >
                {agente}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-4">
        <Label>M² Estimados: {sliderValue[0]} - {sliderValue[1]}m²</Label>
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
    </CardContent>
    <CardFooter className="flex flex-col items-start gap-2 pt-4 border-t">
      <Label className="font-semibold">Filtros Activos:</Label>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(filter => (
            <Badge key={`${filter.key}-${filter.value}`} variant="secondary" className="flex items-center gap-1.5 pl-2">
              <span>{filter.type}: {filter.value}</span>
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