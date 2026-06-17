import { Request, Response, NextFunction } from "express";

// Moderadores e diretores podem ativar cenas e visualizar resultados
export const isModerator = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "moderator" && req.user?.role !== "director") {
    res.status(403).json({ msg: "Acesso negado: requer permissão de moderador ou diretor" });
    return;
  }
  next();
};
