import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CiberThreats - Painel de Controle",
  description: "Aplicação para registro e classificação automática de incidentes de segurança cibernética",
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
