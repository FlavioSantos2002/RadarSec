import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import router from "./router/index";

dotenv.config();

const app = express();

// 1. LOG GLOBAL DE REQUISIÇÕES
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. HELMET (Ajustado para não bloquear o Cross-Origin do Next.js)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hidePoweredBy: true,
  })
);

// 3. CORS (Reforçado para aceitar PUT e credenciais)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 4. PARSER
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. RATE LIMIT (500 requisições para evitar bloqueios em testes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { erro: "Limite excedido." },
});
app.use(globalLimiter);

// 6. ROTAS
app.use("/v1", router);

// 7. TRATAMENTO DE ERROS GLOBAL
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("ERRO CAPTURADO NO MIDDLEWARE:", err.stack);
  if (err.message && err.message.includes("não permitido")) {
    res.status(400).json({ msg: err.message });
    return;
  }
  res.status(500).json({ msg: "Erro interno no servidor", error: err.message });
});

// 8. INICIALIZAÇÃO DO SERVIDOR
const PORT = process.env.PORT || 3333;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`RadarSec API rodando na porta ${PORT}`);
});