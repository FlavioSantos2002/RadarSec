import prisma from '../../lib/prisma';
import { isProjectMember } from '../projects/projects.service';

export async function getProjectReport(projectId: string, userId: string) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  const [byStatus, bySeverity, total] = await Promise.all([
    prisma.finding.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    }),
    prisma.finding.groupBy({
      by: ['severity'],
      where: { projectId },
      _count: { id: true },
    }),
    prisma.finding.count({ where: { projectId } }),
  ]);

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
  };
}

export async function exportFindings(
  projectId: string,
  userId: string,
  format: 'json' | 'csv'
) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  const findings = await prisma.finding.findMany({
    where: { projectId },
    include: {
      author: { select: { name: true, email: true } },
      assignedTo: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'json') {
    return { type: 'json' as const, data: findings };
  }

  const headers = [
    'ID',
    'Título',
    'Descrição',
    'Vetor de ataque',
    'Severidade',
    'Status',
    'Prioridade',
    'Nota CVSS',
    'Autor',
    'Atribuído a',
    'Criado em',
  ];

  const rows = findings.map((f) => [
    f.id,
    `"${f.title.replace(/"/g, '""')}"`,
    `"${f.description.replace(/"/g, '""')}"`,
    `"${f.attackVector.replace(/"/g, '""')}"`,
    f.severity,
    f.status,
    f.priority ?? '',
    f.cvssScore ?? '',
    f.author.name,
    f.assignedTo?.name ?? '',
    f.createdAt.toISOString(),
  ]);

  const csv = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');
  return { type: 'csv' as const, data: csv };
}

export async function globalSearch(
  userId: string,
  query: string,
  projectId?: string
) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  const projectIds = projectId
    ? memberships.filter((m) => m.projectId === projectId).map((m) => m.projectId)
    : memberships.map((m) => m.projectId);

  if (projectIds.length === 0) return [];

  return prisma.finding.findMany({
    where: {
      projectId: { in: projectIds },
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { attackVector: { contains: query, mode: 'insensitive' } },
        { payload: { contains: query, mode: 'insensitive' } },
        { poc: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      project: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
