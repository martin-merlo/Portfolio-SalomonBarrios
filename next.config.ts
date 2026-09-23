import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes de los bloques se sirven desde Supabase Storage
    // (<proyecto>.supabase.co). Habilitamos next/image para ese host sin
    // hardcodear el subdominio del proyecto ni leer .env.
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
