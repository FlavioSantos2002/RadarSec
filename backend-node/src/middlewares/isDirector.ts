import { Request, Response, NextFunction } from "express";

// Apenas diretores podem acessar rotas administrativas de sessão
export const isDirector = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "director") {
    res.status(403).json({ msg: "Acesso negado: requer permissão de diretor" });
    return;
  }
  next();
};
