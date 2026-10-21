import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salve Minha Planta — Diagnóstico de plantas com IA",
  description:
    "Envie uma foto da sua planta e receba na hora o diagnóstico com IA: identificação, doenças, pragas e plano de cuidados.",
  openGraph: {
    title: "Salve Minha Planta",
    description:
      "Envie uma foto da sua planta e receba na hora o diagnóstico com IA: identificação, doenças, pragas e plano de cuidados.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-bg text-zinc-50">{children}</body>
    </html>
  );
}
