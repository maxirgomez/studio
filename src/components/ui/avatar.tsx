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
  }, [name, children]);

  // Función para extraer las iniciales del nombre
  const getInitials = (fullName?: string) => {
    if (!fullName || typeof fullName !== 'string') return null
    
    const words = fullName.trim().split(/\s+/)
    if (words.length === 0) return null
    
    if (words.length === 1) {
      return words[0][0]?.toUpperCase() || null
    }
    
    // Primera letra del nombre + primera letra del apellido
    const firstInitial = words[0][0]?.toUpperCase() || ""
    const lastInitial = words[words.length - 1][0]?.toUpperCase() || ""
    
    return firstInitial + lastInitial
  }

  // Función para extraer las iniciales de un objeto de usuario
  const getInitialsFromObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return null
    
    // Si ya tiene initials como string, usarlo
    if (obj.initials && typeof obj.initials === 'string' && obj.initials.trim()) {
      return obj.initials.trim().substring(0, 2).toUpperCase()
    }
    
    // Intentar generar desde nombre y apellido
    const nombre = typeof obj.nombre === 'string' ? obj.nombre.trim() : ''
    const apellido = typeof obj.apellido === 'string' ? obj.apellido.trim() : ''
    
    if (nombre) {
      const firstLetter = nombre[0] || ''
      const lastLetter = apellido ? apellido[0] || '' : ''
      const initials = `${firstLetter}${lastLetter}`.trim().toUpperCase()
      if (initials) return initials
    }
    
    // Intentar desde user
    const user = typeof obj.user === 'string' ? obj.user.trim() : ''
    if (user) {
      return user[0]?.toUpperCase() || null
    }
    
    return null
  }

  // Función para obtener el contenido a renderizar
  const getContent = (): React.ReactNode => {
    try {
      
      // Mostrar el valor completo de children si es string
      if (typeof children === 'string') {
      
      }
      
      if (children && typeof children === 'object' && children !== null) {
      
      }
      
      // Si hay un name prop válido, usarlo
      if (mounted && name && typeof name === 'string') {
        const initials = getInitials(name)
        if (initials) {
          
          return initials
        }
      }
      
      // Si children existe, verificar qué tipo es
      if (children !== undefined && children !== null) {
        // Si es un string o number, renderizarlo directamente
        if (typeof children === 'string' || typeof children === 'number') {
          
          return String(children)
        }
        
        // Si es un boolean, retornar null (no renderizar nada)
        if (typeof children === 'boolean') {
          
          return null
        }
        
        // Si es un React element válido, renderizarlo
        if (React.isValidElement(children)) {
          
          return children
        }
        
        // Si es un array, procesar el primer elemento válido
        if (Array.isArray(children)) {
          
          const firstValid = children.find(child => {
            if (typeof child === 'string' || typeof child === 'number') return true
            if (React.isValidElement(child)) return true
            return false
          })
          if (firstValid) {
            if (typeof firstValid === 'string' || typeof firstValid === 'number') {
          
              return String(firstValid)
            }
            if (React.isValidElement(firstValid)) {
          
              return firstValid
            }
          }
          // Si no hay elementos válidos en el array, intentar procesar el primer objeto
          const firstObj = children.find(child => typeof child === 'object' && child !== null && !React.isValidElement(child))
          if (firstObj) {
          
            const initials = getInitialsFromObject(firstObj as any)
            if (initials) {
          
              return initials
            }
          }
          // Si no se encontró nada válido en el array, retornar fallback
          
          return "?"
        }
        
        // Si es un objeto (pero no un React element ni un array), intentar extraer iniciales
        if (typeof children === 'object' && !React.isValidElement(children) && !Array.isArray(children)) {
          
          const childrenObj = children as any
          
          // PRIMERO: Intentar extraer iniciales usando getInitialsFromObject
          const initials = getInitialsFromObject(childrenObj)
          if (initials) {
          
            return initials
          }
          
          // SEGUNDO: Si el objeto tiene una propiedad name, intentar usarla
          if (childrenObj.name && typeof childrenObj.name === 'string') {
            const initialsFromName = getInitials(childrenObj.name)
            if (initialsFromName) {
          
              return initialsFromName
            }
          }
          
          // TERCERO: Si tiene propiedades nombre y apellido, intentar combinarlas
          if (childrenObj.nombre && typeof childrenObj.nombre === 'string') {
            const nombre = childrenObj.nombre.trim()
            const apellido = (childrenObj.apellido && typeof childrenObj.apellido === 'string') 
              ? childrenObj.apellido.trim() 
              : ''
            if (nombre) {
              const firstLetter = nombre[0] || ''
              const lastLetter = apellido ? apellido[0] || '' : ''
              const combined = `${firstLetter}${lastLetter}`.trim().toUpperCase()
              if (combined) {
          
                return combined
              }
            }
          }
          
          // CUARTO: Si tiene propiedad user, usar la primera letra
          if (childrenObj.user && typeof childrenObj.user === 'string') {
            const user = childrenObj.user.trim()
            if (user) {
              const result = user[0]?.toUpperCase() || "?"
          
              return result
            }
          }
          
          // QUINTO: Si tiene propiedad email o mail, usar la primera letra
          if (childrenObj.email && typeof childrenObj.email === 'string') {
            const email = childrenObj.email.trim()
            if (email) {
              const result = email[0]?.toUpperCase() || "?"
          
              return result
            }
          }
          if (childrenObj.mail && typeof childrenObj.mail === 'string') {
            const mail = childrenObj.mail.trim()
            if (mail) {
              const result = mail[0]?.toUpperCase() || "?"
          
              return result
            }
          }
          
          // IMPORTANTE: NUNCA retornar el objeto directamente
          // Si llegamos aquí, retornar un fallback seguro
          
          return "?"
        }
      }
      
      // Fallback por defecto
      
      return "?"
    } catch (error) {
      
      return "?"
    }
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
      {getContent()}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
