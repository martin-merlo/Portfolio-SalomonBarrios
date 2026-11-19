import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes de los bloques se sirven desde Supabase Storage
    // (<proyecto>.supabase.co). Habilitamos next/image para ese host sin
    // hardcodear el subdominio del proyecto ni leer .env.
    // Tope de 1600px en lo que entrega next/image (antes llegaba a 3840): no se
    // puede pedir /_next/image con un ancho mayor. Parte de la protección de
    // las obras — ver components/ProtegerObras.tsx.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [96, 128, 256, 384],
    // 31 días de caché para cada versión optimizada (el default es 60s). Las
    // imágenes que sube el panel nunca cambian en el lugar: cada subida lleva
    // un nombre nuevo (UUID), así que no hay riesgo de servir una vieja. Menos
    // re-optimizaciones = menos uso del cupo de Vercel. Única excepción:
    // scripts/reducir-imagenes.mjs reemplaza archivos en el lugar; si se vuelve
    // a correr, la versión optimizada vieja puede seguir sirviéndose hasta 31 días.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
