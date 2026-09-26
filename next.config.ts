import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le règlement intérieur est joint à l'email de confirmation : la fonction
  // d'inscription doit donc l'avoir sous la main, et pas seulement le CDN.
  outputFileTracingIncludes: {
    "/api/registration": ["./public/*.pdf"],
    // La vitrine teste la présence d'une vidéo de fond au moment du rendu.
    // Sans ce tracing, le test répondrait toujours « non » en production : les
    // fichiers de `public/` sont servis par le CDN mais ne sont pas embarqués
    // dans la fonction. Déposer une vidéo suffirait alors localement et ne
    // changerait rien en ligne — exactement le genre d'écart à éviter.
    "/rejoindre": ["./public/videos/*"],
  },
};

export default nextConfig;
