import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para Docker
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
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
    unoptimized: false,
    dangerouslyAllowSVG: true,
    // Configuración adicional para producción
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
