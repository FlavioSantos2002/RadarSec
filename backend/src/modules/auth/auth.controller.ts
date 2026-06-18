import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as authService from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60 * 1000,
};

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar.';
    res.status(400).json({ error: message });
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ user, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer login.';
    res.status(401).json({ error: message });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const user = await authService.getUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  res.json({ user });
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  res.clearCookie('token');
  res.json({ message: 'Logout realizado com sucesso.' });
}
