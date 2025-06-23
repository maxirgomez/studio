"use client"

import Link from "next/link"
import {
  Home,
  PanelLeft,
  Users,
  MapPin,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { UserNav } from "@/components/dashboard/user-nav"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { BaigunRealtyLogo } from "@/components/ui/logo"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Lotes" },
    { href: "/dashboard/profile", icon: Users, label: "Usuarios" },
    { href: "/dashboard/mapa", icon: MapPin, label: "Mapa" },
  ];

  const desktopNav = (
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 lg:gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <BaigunRealtyLogo className="h-8 w-auto" />
          <span className="sr-only">Baigun Realty</span>
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "transition-opacity",
              pathname === item.href
                ? "opacity-100"
                : "opacity-70 hover:opacity-100"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
  );

  const mobileNav = (
    <nav className="grid gap-2 text-lg font-medium">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold mb-4"
      >
        <BaigunRealtyLogo className="h-8 w-auto" />
        <span className="sr-only">Baigun Realty</span>
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
            pathname === item.href && "bg-muted text-foreground"
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-header text-header-foreground px-6">
        {desktopNav}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            {mobileNav}
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial" />
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 bg-background">
        {children}
      </main>
    </div>
  )
}
