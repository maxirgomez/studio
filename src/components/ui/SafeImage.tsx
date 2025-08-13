import React, { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export function SafeImage({ 
  src, 
  alt, 
  width = 600, 
  height = 400, 
  className = "", 
  fallback,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isRetrying, setIsRetrying] = useState(false);

  // Función para generar URL alternativa si la primera falla
  const getAlternativeUrl = (url: string): string | null => {
    if (url.includes('fotos.usig.buenosaires.gob.ar')) {
      const match = url.match(/smp=([^&]+)/);
      if (match) {
        const smp = match[1];
        // Si está en minúscula, probar con mayúscula
        if (smp === smp.toLowerCase()) {
          return url.replace(smp, smp.toUpperCase());
        }
        // Si está en mayúscula, probar con minúscula
        if (smp === smp.toUpperCase()) {
          return url.replace(smp, smp.toLowerCase());
        }
      }
    }
    return null;
  };

  if (!currentSrc || hasError) {
    console.log('SafeImage: Mostrando fallback para:', currentSrc, 'Error:', hasError);
    return fallback || (
      <div className={`aspect-video bg-muted flex items-center justify-center rounded-lg ${className}`}>
        <p className="text-muted-foreground">Imagen no disponible</p>
      </div>
    );
  }

  // Para imágenes del gobierno de Buenos Aires, usar img HTML estándar
  if (currentSrc.includes('fotos.usig.buenosaires.gob.ar')) {
    console.log('SafeImage: Renderizando imagen del gobierno:', currentSrc, isRetrying ? '(reintento)' : '');
    return (
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onError={() => {
          if (!isRetrying) {
            console.warn('SafeImage: Primera URL falló, intentando alternativa...');
            
            // Intentar con URL alternativa
            const alternativeUrl = getAlternativeUrl(currentSrc);
            if (alternativeUrl && alternativeUrl !== currentSrc) {
              console.log('SafeImage: Intentando URL alternativa:', alternativeUrl);
              setCurrentSrc(alternativeUrl);
              setIsRetrying(true);
              setHasError(false);
            } else {
              console.error('SafeImage: No hay URL alternativa disponible');
              setHasError(true);
            }
          } else {
            console.error('SafeImage: Error cargando imagen del gobierno (ambas URLs fallaron):', currentSrc);
            setHasError(true);
          }
        }}
        onLoad={() => {
          if (isRetrying) {
            console.log('SafeImage: ✅ Imagen cargada exitosamente con URL alternativa:', currentSrc);
          } else {
            console.log('SafeImage: ✅ Imagen cargada exitosamente:', currentSrc);
          }
        }}
        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        {...props}
      />
    );
  }

  // Para otras imágenes, usar el componente Image de Next.js
  console.log('SafeImage: Cargando imagen con Next.js Image:', currentSrc);
  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={(e) => {
        console.error('SafeImage: Error cargando imagen Next.js:', currentSrc, e);
        setHasError(true);
      }}
      {...props}
    />
  );
}
