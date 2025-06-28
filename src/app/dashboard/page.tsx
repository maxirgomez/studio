
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { listings, users, getStatusStyles } from "@/lib/data"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Activity, TrendingUp } from "lucide-react"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

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


// Data processing
const processDashboardData = (agentFilter: string) => {
  const filteredListings = agentFilter === 'todos'
    ? listings
    : listings.filter(l => l.agent.name === agentFilter);
  
  const totalLots = filteredListings.length;

  const lotsByStatus = filteredListings.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const recentSales = filteredListings.filter(l => l.saleDate && new Date(l.saleDate) >= subMonths(new Date(), 12));
  const totalSales = recentSales.length;

  const lastMonthSales = filteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const lastMonth = subMonths(new Date(), 1);
    return saleDate >= lastMonth;
  }).length;
  
  const previousMonthSales = filteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const twoMonthsAgo = subMonths(new Date(), 2);
    const lastMonth = subMonths(new Date(), 1);
    return saleDate >= twoMonthsAgo && saleDate < lastMonth;
  }).length;

  const salesChange = previousMonthSales > 0 ? ((lastMonthSales - previousMonthSales) / previousMonthSales) * 100 : lastMonthSales > 0 ? 100 : 0;

  const latestSales = filteredListings
    .filter(l => l.status === 'Vendido' && l.saleDate)
    .sort((a, b) => new Date(b.saleDate!).getTime() - new Date(a.saleDate!).getTime())
    .slice(0, 5);
  
  const lotsByNeighborhoodChartData = Object.values(
    filteredListings.reduce((acc, l) => {
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
    totalSales,
    salesChange,
    latestSales,
    lotsByStatus,
    totalLots,
    lotsByNeighborhoodChartData,
  };
};


export default function DashboardPage() {
  const [agentFilter, setAgentFilter] = useState('todos');

  const { 
    totalLots,
    totalSales,
    salesChange,
    latestSales,
    lotsByStatus,
    lotsByNeighborhoodChartData,
  } = useMemo(() => processDashboardData(agentFilter), [agentFilter]);
  
  const sortedLotsByStatus = Object.entries(lotsByStatus).sort(([a], [b]) => {
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    if(indexA === -1) return 1;
    if(indexB === -1) return -1;
    return indexA - indexB;
  });

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
      
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {sortedLotsByStatus.map(([status, count]) => {
          const styles = getStatusStyles(status);
          return (
            <Card key={status} style={{ backgroundColor: styles.backgroundColor, color: styles.color, borderColor: 'transparent' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{status}</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
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
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
                <BarChart data={lotsByNeighborhoodChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid horizontal={false} />
                   <XAxis type="number" hide />
                   <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={100}
                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0,12)}...` : value}
                  />
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
                      radius={[0, 4, 4, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
            <CardDescription>
              Se han realizado {totalSales} ventas en los últimos 12 meses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {latestSales.map(sale => (
                <div key={sale.smp} className="flex items-center">
                  <Avatar className="h-9 w-9">
                     <AvatarImage src={"https://placehold.co/100x100.png"} data-ai-hint={"person"} />
                    <AvatarFallback>{sale.agent.initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.address}</p>
                    <p className="text-sm text-muted-foreground">
                      Vendido por {sale.agent.name}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">{formatPrice(sale.valorVentaUSD || 0)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
