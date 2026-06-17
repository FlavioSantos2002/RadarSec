import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RadarSec — Cybersecurity Operations",
  description: "Plataforma de gestão de projetos e incidentes de cibersegurança para times SOC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
