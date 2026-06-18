import prisma from '../../lib/prisma';
import { sanitizeRequiredText } from '../../utils/sanitize.util';

export async function listTimelineMessages(findingId: string, userId: string) {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { project: { include: { members: true } } },
  });

  if (!finding) return null;

  const isMember = finding.project.members.some((m) => m.userId === userId);
  if (!isMember) return null;

  return prisma.timelineMessage.findMany({
    where: { findingId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createTimelineMessage(
  findingId: string,
  authorUserId: string,
  content: string
) {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { project: { include: { members: true } } },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const isMember = finding.project.members.some((m) => m.userId === authorUserId);
  if (!isMember) throw new Error('Acesso negado.');

  return prisma.timelineMessage.create({
    data: {
      findingId,
      authorUserId,
      content: sanitizeRequiredText(content),
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}
