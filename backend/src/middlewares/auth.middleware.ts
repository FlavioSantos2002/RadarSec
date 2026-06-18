import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'supersecret_change_in_production';

export function signToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token =
      req.cookies?.token ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export { JWT_SECRET };