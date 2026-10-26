import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Subida de archivos del paciente (límite propio de 4 MB en la action).
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
