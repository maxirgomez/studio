
"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listings, users, getStatusStyles } from "@/lib/data"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Activity, TrendingUp, X } from "lucide-react"
import { subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";


const statusOrder = [
    "Tomar Acción",
    "Tasación",
    "Evolucionando",
    "Disponible",
    "Reservado",
    "Vendido",
    "No vende",
    "Descartado",
];
  
const chartConfig = statusOrder.reduce((acc, status) => {
    const styles = getStatusStyles(status);
    acc[status] = {
        label: status,
        color: styles.backgroundColor,
    };
    return acc;
}, {} as ChartConfig);


const processDashboardData = (agentFilter: string, statusFilter: string) => {
  // 1. Filter by agent first
  const agentFilteredListings = agentFilter === 'todos'
    ? listings
    : listings.filter(l => l.agent.name === agentFilter);
  
  // 2. Calculate status counts based on agent filter (for the cards)
  const lotsByStatus = agentFilteredListings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Apply status filter
  const fullyFilteredListings = statusFilter
    ? agentFilteredListings.filter(l => l.status === statusFilter)
    : agentFilteredListings;

  // 4. Calculate KPIs and chart data from fully filtered list
  const totalLots = listings.length;

  const recentSales = fullyFilteredListings.filter(l => l.saleDate && new Date(l.saleDate) >= subMonths(new Date(), 12));
  const totalSales = recentSales.length;

  const lastMonthSales = fullyFilteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const lastMonth = subMonths(new Date(), 1);
    return saleDate >= lastMonth;
  }).length;
  
  const previousMonthSales = fullyFilteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const twoMonthsAgo = subMonths(new Date(), 2);
    const lastMonth = subMonths(new Date(), 1);
    return saleDate >= twoMonthsAgo && saleDate < lastMonth;
  }).length;

  const salesChange = previousMonthSales > 0 ? ((lastMonthSales - previousMonthSales) / previousMonthSales) * 100 : lastMonthSales > 0 ? 100 : 0;
  
  const lotsByNeighborhoodChartData = Object.values(
    fullyFilteredListings.reduce((acc, l) => {
      const neighborhood = l.neighborhood;
      const status = l.status;
      if (!acc[neighborhood]) {
        acc[neighborhood] = { name: neighborhood };
        statusOrder.forEach(s => { acc[neighborhood][s] = 0; });
      }
      acc[neighborhood][status] = (acc[neighborhood][status] || 0) + 1;
      return acc;
    }, {} as Record<string, any>)
  );

  return { 
    totalLots: fullyFilteredListings.length,
    totalSales,
    salesChange,
    lotsByStatus,
    lotsByNeighborhoodChartData,
    filteredListings: fullyFilteredListings,
  };
};


export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const agentFilter = searchParams.get('agent') || 'todos';
  const statusFilter = searchParams.get('status') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const listingsPerPage = Number(searchParams.get('pageSize')) || 10;

  const { 
    totalLots,
    totalSales,
    salesChange,
    lotsByStatus,
    lotsByNeighborhoodChartData,
    filteredListings
  } = useMemo(() => processDashboardData(agentFilter, statusFilter), [agentFilter, statusFilter]);
  
  const totalPages = Math.ceil(filteredListings.length / listingsPerPage);
  const listingsOnPage = filteredListings.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );
  
  const sortedLotsByStatus = Object.entries(lotsByStatus).sort(([a], [b]) => {
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    if(indexA === -1) return 1;
    if(indexB === -1) return -1;
    return indexA - indexB;
  });

  const createQueryString = useCallback(
    (paramsToUpdate: Record<string, string | null | number>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(paramsToUpdate)) {
        if (value === null || value === '' || value === 'todos') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleAgentFilterChange = (agent: string) => {
    router.push(`${pathname}?${createQueryString({ agent, page: 1 })}`, { scroll: false });
  };

  const handleStatusFilterChange = (status: string) => {
    const newStatus = statusFilter === status ? null : status;
    router.push(`${pathname}?${createQueryString({ status: newStatus, page: 1 })}`, { scroll: false });
  };
  
  const handleRemoveFilter = (key: string) => {
    router.push(`${pathname}?${createQueryString({ [key]: null, page: 1 })}`, { scroll: false });
  };

  const activeFilters = [];
  if (agentFilter !== 'todos') {
    activeFilters.push({ type: 'Agente', value: agentFilter, key: 'agent' });
  }
  if (statusFilter) {
    activeFilters.push({ type: 'Estado', value: statusFilter, key: 'status' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Una vista general de la actividad de los lotes.</p>
        </div>
        <div className="w-full max-w-xs">
          <Select value={agentFilter} onValueChange={handleAgentFilterChange}>
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

      <div className="flex flex-wrap items-center gap-2">
        {activeFilters.length > 0 && <span className="text-sm font-medium">Filtros Activos:</span>}
        {activeFilters.map(filter => (
          <Badge key={`${filter.key}-${filter.value}`} variant="secondary" className="flex items-center gap-1.5 pl-2">
            <span>{filter.type}: {filter.value}</span>
            <button onClick={() => handleRemoveFilter(filter.key)} className="rounded-full p-0.5 text-muted-foreground hover:bg-background/50 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        {sortedLotsByStatus.map(([status, count]) => {
          const styles = getStatusStyles(status);
          return (
            <button
              key={status}
              onClick={() => handleStatusFilterChange(status)}
              className={cn(
                "w-full text-left rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                statusFilter === status ? "ring-2 ring-primary ring-offset-background" : "ring-0"
              )}
            >
              <Card style={{ backgroundColor: styles.backgroundColor, color: styles.color, borderColor: 'transparent' }} className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{status}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLots}</div>
            <p className="text-xs text-muted-foreground">
              {statusFilter ? `Lotes con estado "${statusFilter}"` : "Total de lotes según filtros"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas (12m)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {salesChange >= 0 ? '+' : ''}{salesChange.toFixed(1)}% vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 mt-4 grid-cols-1">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Lotes por Barrio</CardTitle>
            <CardDescription>
              Distribución de lotes por estado en cada barrio.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lotsByNeighborhoodChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 10)}...` : value}
                  />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Legend content={<ChartLegendContent />} />
                  {statusOrder.map((status) => (
                    <Bar
                      key={status}
                      dataKey={status}
                      stackId="a"
                      fill={getStatusStyles(status).backgroundColor}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                      <CardTitle>Listado de Lotes</CardTitle>
                      <CardDescription>
                          Una tabla detallada de los lotes según los filtros aplicados.
                      </CardDescription>
                  </div>
                  <div className="w-48">
                      <Select
                          value={String(listingsPerPage)}
                          onValueChange={(value) => {
                              router.push(`${pathname}?${createQueryString({ pageSize: value, page: 1 })}`, { scroll: false });
                          }}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="Resultados por página" />
                          </SelectTrigger>
                          <SelectContent>
                              {[10, 20, 50, 100].map(size => (
                                  <SelectItem key={size} value={String(size)}>
                                      {size} por página
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Barrio</TableHead>
                            <TableHead className="text-right">M² Estimados</TableHead>
                            <TableHead className="text-right">M² Calculados</TableHead>
                            <TableHead className="text-right">Valor Venta (USD)</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Agente</TableHead>
                            <TableHead>Origen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {listingsOnPage.map((listing) => (
                            <TableRow key={listing.smp}>
                                <TableCell className="font-medium">{listing.address}</TableCell>
                                <TableCell>{listing.neighborhood}</TableCell>
                                <TableCell className="text-right">{listing.area}</TableCell>
                                <TableCell className="text-right">{listing.area}</TableCell>
                                <TableCell className="text-right">
                                  {listing.valorVentaUSD.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
                                </TableCell>
                                <TableCell>
                                    <Badge style={getStatusStyles(listing.status)}>{listing.status}</Badge>
                                </TableCell>
                                <TableCell>{listing.agent.name}</TableCell>
                                <TableCell>{listing.origen}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between items-center w-full">
                  <div className="text-xs text-muted-foreground">
                      Mostrando {listingsOnPage.length} de {filteredListings.length} lotes.
                  </div>
                  {totalPages > 1 && (
                      <Pagination>
                          <PaginationContent>
                              {currentPage > 1 && (
                              <PaginationItem>
                                  <PaginationPrevious href={`${pathname}?${createQueryString({ page: currentPage - 1 })}`} />
                              </PaginationItem>
                              )}
                              {[...Array(totalPages)].map((_, i) => (
                                  <PaginationItem key={i}>
                                      <PaginationLink
                                          href={`${pathname}?${createQueryString({ page: i + 1 })}`}
                                          isActive={currentPage === i + 1}
                                      >
                                          {i + 1}
                                      </PaginationLink>
                                  </PaginationItem>
                              ))}
                              {currentPage < totalPages && (
                              <PaginationItem>
                                  <PaginationNext href={`${pathname}?${createQueryString({ page: currentPage + 1 })}`} />
                              </PaginationItem>
                              )}
                          </PaginationContent>
                      </Pagination>
                  )}
              </div>
            </CardFooter>
        </Card>
      </div>
    </div>
  )
}
