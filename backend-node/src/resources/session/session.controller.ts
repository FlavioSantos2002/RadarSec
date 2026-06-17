import { Request, Response } from "express";
import * as sessionService from "./session.service";

export const getAllSessions = async (_req: Request, res: Response) => {
  try {
    const sessions = await sessionService.getAllSessions();
    res.status(200).json(sessions);
  } catch {
    res.status(500).json({ msg: "Erro interno ao listar sessões" });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.status(200).json(session);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Sessão não encontrada" });
    else res.status(500).json({ msg: "Erro interno no servidor" });
  }
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.createSession(req.user!.userId, req.body);
    res.status(201).json(session);
  } catch {
    res.status(500).json({ msg: "Erro ao criar sessão" });
  }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const session = await sessionService.updateSessionStatus(
      req.user!.userId,
      req.params.id,
      req.body.status
    );
    res.status(200).json(session);
  } catch (error: any) {
    if (error.message === "NOT_FOUND")
      res.status(404).json({ msg: "Sessão não encontrada ou acesso negado" });
    else res.status(500).json({ msg: "Erro interno no servidor" });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    await sessionService.deleteSession(req.user!.userId, req.params.id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "NOT_FOUND")
      res.status(404).json({ msg: "Sessão não encontrada ou acesso negado" });
    else res.status(500).json({ msg: "Erro interno no servidor" });
  }
};

export const addScene = async (req: Request, res: Response) => {
  try {
    const scene = await sessionService.addScene(req.user!.userId, req.params.id, req.body);
    res.status(201).json(scene);
  } catch (error: any) {
    if (error.message === "NOT_FOUND")
      res.status(404).json({ msg: "Sessão não encontrada ou acesso negado" });
    else res.status(500).json({ msg: "Erro ao adicionar cena" });
  }
};

export const activateScene = async (req: Request, res: Response) => {
  try {
    const scene = await sessionService.activateScene(
      req.params.sessionId,
      req.params.sceneId
    );
    res.status(200).json(scene);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Cena não encontrada" });
    else res.status(500).json({ msg: "Erro ao ativar cena" });
  }
};

export const castVote = async (req: Request, res: Response) => {
  try {
    const vote = await sessionService.castVote(
      req.user!.userId,
      req.body.sceneId,
      req.body.choiceId
    );
    res.status(201).json(vote);
  } catch (error: any) {
    if (error.message === "INVALID_CHOICE")
      res.status(400).json({ msg: "Opção inválida para esta cena" });
    else if (error.message === "SCENE_NOT_ACTIVE")
      res.status(400).json({ msg: "Cena não está ativa para votação" });
    else if (error.code === "P2002")
      res.status(409).json({ msg: "Você já votou nesta cena" });
    else res.status(500).json({ msg: "Erro ao registrar voto" });
  }
};
