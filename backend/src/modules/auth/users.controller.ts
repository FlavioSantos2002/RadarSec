import { Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth.middleware';

export async function listUsers(_req: AuthRequest, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
  res.json({ users });
}
