"use client"
import Link from "next/link"
import {
  Building2,
  Home,
  LayoutGrid,
  Map,
  PanelLeft,
  Users,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/dashboard/user-nav"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard/mapa", icon: Map, label: "Mapa Lotes" },
    { href: "/dashboard", icon: LayoutGrid, label: "Lotes" },
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/profile", icon: Users, label: "Usuarios" },
  ];

  const mainNav = (
     <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
      {navItems.map(item => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "text-primary-foreground/70 transition-colors hover:text-primary-foreground",
            pathname.startsWith(item.href) && item.href !== "/dashboard" ? "text-primary-foreground" : "",
            pathname === item.href && item.href === "/dashboard" ? "text-primary-foreground" : ""
            )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const mobileNav = (
     <nav className="grid gap-2 text-lg font-medium">
      {navItems.map(item => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
             pathname.startsWith(item.href) && item.href !== "/dashboard" ? "text-foreground" : "",
             pathname === item.href && item.href === "/dashboard" ? "text-foreground" : ""
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
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-primary px-4 md:px-6 text-primary-foreground z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Building2 className="h-6 w-6" />
          <span className="font-bold">BAIGUN REALTY</span>
        </Link>

        <div className="hidden md:flex md:flex-1 md:items-center md:gap-6">
          <div className="ml-auto flex-1 sm:flex-initial">
             {mainNav}
          </div>
        </div>

        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
                 {/* Search bar can go here */}
            </div>
          <UserNav />
        </div>
        
        <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden !bg-transparent !border-primary-foreground/50 hover:!bg-primary-foreground/10"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              {mobileNav}
            </SheetContent>
          </Sheet>

      </header>
      <main className="flex min-h-[calc(100vh_-_4rem)] flex-col bg-muted/40">
        {children}
      </main>
    </div>
  )
}
