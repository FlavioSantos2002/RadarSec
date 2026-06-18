import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as timelineService from './timeline.service';

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const messages = await timelineService.listTimelineMessages(
    req.params.findingId,
    req.user.userId
  );
  if (messages === null) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  res.json({ messages });
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const message = await timelineService.createTimelineMessage(
      req.params.findingId,
      req.user.userId,
      req.body.content
    );
    res.status(201).json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar mensagem.';
    res.status(400).json({ error: message });
  }
}
