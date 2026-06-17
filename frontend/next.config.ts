import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  // Impede o browser de "adivinhar" o tipo MIME da resposta
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Impede que a página seja embutida em <iframe> de outro site (anti-clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Não envia a URL de origem em requisições externas
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Força HTTPS por 1 ano (ativo apenas em produção)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },

  // Define de onde scripts, estilos e outros recursos podem ser carregados
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`, // 'unsafe-inline' necessário para o Next.js; 'unsafe-eval' necessário em desenvolvimento
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL}/`,
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)", // aplica em todas as rotas
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;