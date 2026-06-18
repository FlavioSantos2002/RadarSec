import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      return;
    }

    next();
  };
}

export const requireGestor = requireRole(Role.GESTOR);
export const requireHunter = requireRole(Role.HUNTER);
