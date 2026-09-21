import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Banat Sport Club — Montpellier",
  description:
    "Association sportive féminine à Montpellier. Entraînements le jeudi soir au Complexe sportif des Garrigues et le dimanche matin au Stade Serge Oltra à Grabels.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e84670",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
