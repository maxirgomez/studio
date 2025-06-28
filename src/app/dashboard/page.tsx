
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
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
import { listings, users } from "@/lib/data"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DollarSign, Home, TrendingUp, Users, Activity } from "lucide-react"
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

// Data processing
const processDashboardData = (agentFilter: string, periodInMonths: number) => {
  const now = new Date();
  const startDate = subMonths(now, periodInMonths);

  const filteredListings = agentFilter === 'todos'
    ? listings
    : listings.filter(l => l.agent.name === agentFilter);
  
  const recentListings = filteredListings.filter(l => l.listingDate && new Date(l.listingDate) >= startDate);
  const recentSales = filteredListings.filter(l => l.saleDate && new Date(l.saleDate) >= startDate);

  const totalRevenue = recentSales.reduce((acc, l) => acc + (l.valorVentaUSD || 0), 0);
  const totalListings = filteredListings.filter(l => l.status === 'Disponible').length;
  const totalSales = recentSales.length;

  const lastMonthSales = filteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const lastMonth = subMonths(now, 1);
    return saleDate >= lastMonth;
  }).length;
  
  const previousMonthSales = filteredListings.filter(l => {
    if (!l.saleDate) return false;
    const saleDate = new Date(l.saleDate);
    const twoMonthsAgo = subMonths(now, 2);
    const lastMonth = subMonths(now, 1);
    return saleDate >= twoMonthsAgo && saleDate < lastMonth;
  }).length;

  const salesChange = previousMonthSales > 0 ? ((lastMonthSales - previousMonthSales) / previousMonthSales) * 100 : lastMonthSales > 0 ? 100 : 0;

  const salesByMonth = recentSales.reduce((acc, listing) => {
    if (listing.saleDate) {
      const month = format(new Date(listing.saleDate), 'LLL', { locale: es });
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const salesChartData = Object.entries(salesByMonth).map(([name, total]) => ({ name, total })).reverse();
  
  const latestSales = filteredListings
    .filter(l => l.status === 'Vendido' && l.saleDate)
    .sort((a, b) => new Date(b.saleDate!).getTime() - new Date(a.saleDate!).getTime())
    .slice(0, 5);

  return { 
    totalRevenue, 
    totalListings, 
    totalSales,
    salesChange,
    salesChartData,
    latestSales 
  };
};


const chartConfig = {
  total: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const [agentFilter, setAgentFilter] = useState('todos');

  const { 
    totalRevenue, 
    totalListings,
    totalSales,
    salesChange,
    salesChartData,
    latestSales 
  } = useMemo(() => processDashboardData(agentFilter, 12), [agentFilter]);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (12m)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes Activos</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalListings}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Feature en desarrollo
            </p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
            <CardDescription>
              Ventas totales en los últimos 12 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px]">
              <BarChart data={salesChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
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
