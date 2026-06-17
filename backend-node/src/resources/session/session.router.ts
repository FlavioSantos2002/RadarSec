import { Router } from "express";
import * as sessionController from "./session.controller";
import { isAuth } from "../../middlewares/isAuth";
import { isDirector } from "../../middlewares/isDirector";
import { isModerator } from "../../middlewares/isModerator";
import { validateBody } from "../../middlewares/validateBody";
import {
  createSessionSchema,
  addSceneSchema,
  voteSchema,
  updateStatusSchema,
} from "./session.schema";

const sessionRouter = Router();

// Todas as rotas exigem autenticação
sessionRouter.use(isAuth);

// ── Espectador (viewer) ─────────────────────────────────────────
// Listar todas as sessões
sessionRouter.get("/", sessionController.getAllSessions);

// Detalhe de uma sessão (com cenas, escolhas e contagem de votos)
sessionRouter.get("/:id", sessionController.getSessionById);

// Votar em uma escolha de cena ativa
sessionRouter.post("/vote", validateBody(voteSchema), sessionController.castVote);

// ── Moderador (moderator | director) ───────────────────────────
// Ativar uma cena específica para votação
sessionRouter.patch(
  "/:sessionId/scenes/:sceneId/activate",
  isModerator,
  sessionController.activateScene
);

// ── Diretor (director) ─────────────────────────────────────────
// Criar nova sessão
sessionRouter.post(
  "/",
  isDirector,
  validateBody(createSessionSchema),
  sessionController.createSession
);

// Alterar status da sessão (waiting → active → finished)
sessionRouter.patch(
  "/:id/status",
  isDirector,
  validateBody(updateStatusSchema),
  sessionController.updateSessionStatus
);

// Adicionar cena a uma sessão
sessionRouter.post(
  "/:id/scenes",
  isDirector,
  validateBody(addSceneSchema),
  sessionController.addScene
);

// Excluir sessão
sessionRouter.delete("/:id", isDirector, sessionController.deleteSession);

export default sessionRouter;
