import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para Firebase Hosting estático
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuración de assetPrefix para archivos estáticos
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Configuración para archivos estáticos en producción
  async headers() {
    return [
      {
        // Cache estático para archivos en public/
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 año de cache
          },
        ],
      },
      {
        source: '/avatars/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache para archivos estáticos de Next.js
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // Cache para archivos de fuentes
        source: '/_next/static/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  
  // Configuración para compresión y optimización
  compress: true,
  
  // Configuración de imágenes optimizada
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'baigunrealty.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fotos.usig.buenosaires.gob.ar',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Necesario para exportación estática
    dangerouslyAllowSVG: true,
    // Configuración adicional para producción
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
