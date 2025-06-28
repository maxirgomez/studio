
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { listings, users, getStatusStyles } from "@/lib/data"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

// Data processing logic
const processData = (agentFilter: string) => {
  const filteredListings = agentFilter === 'todos'
    ? listings
    : listings.filter(l => l.agent.name === agentFilter);

  // 1. Lot count by status
  const lotesPorEstado = [...new Set(listings.map(l => l.status))].reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<string, number>);

  filteredListings.forEach(listing => {
    lotesPorEstado[listing.status] = (lotesPorEstado[listing.status] || 0) + 1;
  });

  const chartData = Object.entries(lotesPorEstado).map(([name, count]) => ({ name, lotes: count }));

  // 2. Lot count by neighborhood, aggregated by status
  const lotesPorBarrioYEstado = filteredListings.reduce((acc, listing) => {
    if (!acc[listing.neighborhood]) {
      acc[listing.neighborhood] = {};
    }
    acc[listing.neighborhood][listing.status] = (acc[listing.neighborhood][listing.status] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // 3. Lot count by neighborhood, aggregated by origin
  const lotesPorBarrioYOrigen = filteredListings.reduce((acc, listing) => {
    if (!acc[listing.neighborhood]) {
      acc[listing.neighborhood] = {};
    }
    acc[listing.neighborhood][listing.origen] = (acc[listing.neighborhood][listing.origen] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return { lotesPorEstado, chartData, lotesPorBarrioYEstado, lotesPorBarrioYOrigen };
};

const chartConfig = {
  lotes: {
    label: "Lotes",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const [agentFilter, setAgentFilter] = useState('todos');

  const { lotesPorEstado, chartData, lotesPorBarrioYEstado, lotesPorBarrioYOrigen } = useMemo(() => processData(agentFilter), [agentFilter]);

  const allStatuses = [...new Set(listings.map(l => l.status))];
  const allOrigins = [...new Set(listings.map(l => l.origen))];
  const allNeighborhoods = [...new Set(listings.map(l => l.neighborhood))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Una vista general de la actividad de los lotes.</p>
        </div>
        <div className="w-full max-w-xs">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por agente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los agentes</SelectItem>
              {users.map(user => (
                <SelectItem key={user.email} value={user.name}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(lotesPorEstado).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <Badge className="mt-1" style={getStatusStyles(status)}>{status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>Lotes por Estado</CardTitle>
            <CardDescription>
              {agentFilter === 'todos' ? 'Total de lotes por estado para todos los agentes.' : `Lotes por estado para ${agentFilter}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="lotes" fill="var(--color-lotes)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lotes por Barrio y Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barrio</TableHead>
                  {allStatuses.map(status => (
                    <TableHead key={status} className="text-right">{status}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allNeighborhoods.map(barrio => (
                  <TableRow key={barrio}>
                    <TableCell className="font-medium">{barrio}</TableCell>
                    {allStatuses.map(status => (
                      <TableCell key={status} className="text-right">{lotesPorBarrioYEstado[barrio]?.[status] || 0}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lotes por Barrio y Origen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barrio</TableHead>
                  {allOrigins.map(origen => (
                    <TableHead key={origen} className="text-right">{origen}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allNeighborhoods.map(barrio => (
                  <TableRow key={barrio}>
                    <TableCell className="font-medium">{barrio}</TableCell>
                    {allOrigins.map(origen => (
                      <TableCell key={origen} className="text-right">{lotesPorBarrioYOrigen[barrio]?.[origen] || 0}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

    