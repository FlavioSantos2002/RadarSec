import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import router from "./router/index";

dotenv.config();

const app = express();

// 1. LOG GLOBAL DE REQUISIÇÕES (Fundamental para sabermos se o sinal chega no Node)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. HELMET (Ajustado para não bloquear o Cross-Origin do seu Next.js)
app.use(
  helmet({
    contentSecurityPolicy: false, // Desativamos temporariamente para evitar o erro 500 silencioso
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

// 4. PARSER (Deve vir antes das rotas e do rate limit)
app.use(express.json());

// 5. RATE LIMIT (Aumentado para evitar bloqueios em testes de desenvolvimento)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Aumentado de 100 para 500
  message: { erro: "Limite excedido." },
});
app.use(globalLimiter);

// 6. ROTAS
app.use("/v1", router);

// 8. TRATAMENTO DE ERROS GLOBAL (Isso vai forçar o erro 500 a aparecer no terminal)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("ERRO CAPTURADO NO MIDDLEWARE:", err.stack);
  res.status(500).json({ msg: "Erro interno no servidor", error: err.message });
});

const PORT = process.env.PORT || 3333;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`CyberThreats API rodando na porta ${PORT}`);
});