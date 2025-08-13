import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  },
};

export default nextConfig;
