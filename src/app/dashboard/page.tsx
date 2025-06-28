
"use client"

import * as React from "react"
import { useState, useMemo, useCallback } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts"
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
import { Activity, TrendingUp, X, DollarSign, ArrowUpNarrowWide } from "lucide-react"
import { format, subMonths, differenceInMonths } from "date-fns"
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button"


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
  
const chartConfig = {
  total: {
    label: "Lotes",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


const processDashboardData = (agentFilter: string, statusFilter: string, salesChartRange: "12m" | "6m" | "3m") => {
  const agentFilteredListings = agentFilter === 'todos'
    ? listings
    : listings.filter(l => l.agent.name === agentFilter);
  
  const lotsByStatus = agentFilteredListings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fullyFilteredListings = statusFilter
    ? agentFilteredListings.filter(l => l.status === statusFilter)
    : agentFilteredListings;

  const totalLots = agentFilteredListings.length;

  const salesListings = agentFilteredListings.filter(l => l.status === "Vendido" && l.saleDate);
  
  const today = new Date();
  const currentQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
  const previousQuarterStart = subMonths(currentQuarterStart, 3);
  
  const quarterlySales = salesListings.filter(l => {
    const saleDate = new Date(l.saleDate!);
    return saleDate >= currentQuarterStart && saleDate <= today;
  }).length;

  const previousQuarterSales = salesListings.filter(l => {
    const saleDate = new Date(l.saleDate!);
    return saleDate >= previousQuarterStart && saleDate < currentQuarterStart;
  }).length;

  const quarterlySalesChange = previousQuarterSales > 0 ? ((quarterlySales - previousQuarterSales) / previousQuarterSales) * 100 : quarterlySales > 0 ? 100 : 0;
  
  const lotsByNeighborhoodChartData = Object.entries(
    fullyFilteredListings.reduce((acc, l) => {
      acc[l.neighborhood] = (acc[l.neighborhood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, total]) => ({ name, total }));


  const monthsToShowMap: Record<typeof salesChartRange, number> = {
    '12m': 12, '6m': 6, '3m': 3,
  };
  const monthsToShow = monthsToShowMap[salesChartRange];
  
  const salesByMonthChartData = Array.from({ length: monthsToShow }).map((_, i) => {
    const date = subMonths(new Date(), monthsToShow - 1 - i);
    return {
      name: format(date, 'MMM', { locale: es }),
      total: 0,
    };
  });

  const salesCutoffDate = subMonths(new Date(), monthsToShow);
  salesListings.forEach(l => {
    if (l.saleDate) {
      const saleDate = new Date(l.saleDate);
      if (saleDate >= salesCutoffDate) {
        const monthIndex = differenceInMonths(new Date(), saleDate);
        if (monthIndex < monthsToShow) {
          const chartIndex = salesByMonthChartData.length - 1 - monthIndex;
          if (chartIndex >= 0) {
            salesByMonthChartData[chartIndex].total += 1;
          }
        }
      }
    }
  });

  return { 
    totalLots,
    quarterlySales,
    quarterlySalesChange,
    lotsByStatus,
    lotsByNeighborhoodChartData,
    filteredListings: fullyFilteredListings,
    salesByMonthChartData,
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
  const [salesChartRange, setSalesChartRange] = useState<"12m" | "6m" | "3m">("12m");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { 
    totalLots,
    quarterlySales,
    quarterlySalesChange,
    lotsByStatus,
    lotsByNeighborhoodChartData,
    filteredListings,
    salesByMonthChartData
  } = useMemo(() => {
    const data = processDashboardData(agentFilter, statusFilter, salesChartRange);
    const sortedChartData = [...data.lotsByNeighborhoodChartData].sort((a, b) => {
        return sortOrder === 'asc' ? a.total - b.total : b.total - a.total;
    });
    return { ...data, lotsByNeighborhoodChartData: sortedChartData };
  }, [agentFilter, statusFilter, salesChartRange, sortOrder]);
  
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
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{totalLots}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Trimestre</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{quarterlySales}</div>
            <p className="text-xs text-muted-foreground">
                {quarterlySalesChange >= 0 ? '+' : ''}{quarterlySalesChange.toFixed(1)}% vs trimestre anterior
            </p>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 mt-4 grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Resumen de Ventas</CardTitle>
              <CardDescription>
                Cantidad de lotes vendidos en los últimos {salesChartRange === "12m" ? "12" : salesChartRange === "6m" ? "6" : "3"} meses.
              </CardDescription>
            </div>
            <Select value={salesChartRange} onValueChange={(value) => setSalesChartRange(value as "12m" | "6m" | "3m")}>
              <SelectTrigger className="ml-auto w-[160px]">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Total", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
              <ResponsiveContainer>
                <LineChart
                  data={salesByMonthChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => String(value)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => typeof value === 'number' ? `${value} lotes` : value}
                        indicator="dot"
                    />}
                  />
                  <Line
                    dataKey="total"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{
                      fill: "hsl(var(--primary))",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Total de Lotes por Barrio</CardTitle>
                <CardDescription>
                  Cantidad total de lotes registrados en cada barrio.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                >
                <ArrowUpNarrowWide className="h-4 w-4" />
                <span className="sr-only">Cambiar orden</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lotsByNeighborhoodChartData}
                  layout="vertical"
                  margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value.length > 15 ? `${value.substring(0, 12)}...` : value
                    }
                    width={100}
                  />
                  <XAxis type="number" dataKey="total" />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    barSize={20}
                  />
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
