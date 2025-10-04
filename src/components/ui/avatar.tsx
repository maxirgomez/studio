"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // Optimizar URL de Cloudinary si es necesario
  const optimizedSrc = React.useMemo(() => {
    if (!src) return src;
    
    // Si es una URL de Cloudinary, optimizarla
    if (src.includes('cloudinary.com')) {
      // Ya debería estar optimizada desde el backend, pero podemos agregar más optimizaciones aquí
      return src;
    }
    
    // Si es una URL local, mantenerla
    return src;
  }, [src]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      src={optimizedSrc}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    name?: string
  }
>(({ className, name, children, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Función para extraer las iniciales del nombre
  const getInitials = (fullName?: string) => {
    if (!fullName) return children || "?"
    
    const words = fullName.trim().split(/\s+/)
    if (words.length === 0) return children || "?"
    
    if (words.length === 1) {
      return words[0][0]?.toUpperCase() || children || "?"
    }
    
    // Primera letra del nombre + primera letra del apellido
    const firstInitial = words[0][0]?.toUpperCase() || ""
    const lastInitial = words[words.length - 1][0]?.toUpperCase() || ""
    
    return firstInitial + lastInitial
  }

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium",
        className
      )}
      {...props}
    >
      {mounted && name ? getInitials(name) : children}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
