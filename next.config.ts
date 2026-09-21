import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le règlement intérieur est joint à l'email de confirmation : la fonction
  // d'inscription doit donc l'avoir sous la main, et pas seulement le CDN.
  outputFileTracingIncludes: {
    "/api/registration": ["./public/*.pdf"],
  },
};

export default nextConfig;
