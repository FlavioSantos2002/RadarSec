import prisma from '../../lib/prisma';
import { sanitizeRequiredText, sanitizeText } from '../../utils/sanitize.util';
import { CreateProjectInput, UpdateProjectInput } from './projects.schemas';

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
}

export async function listProjects(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          findings: { select: { id: true, severity: true, status: true } },
          _count: { select: { members: true, findings: true } },
        },
      },
    },
    orderBy: { project: { updatedAt: 'desc' } },
  });

  return memberships.map((m) => ({
    ...m.project,
    memberCount: m.project._count.members,
    findingCount: m.project._count.findings,
    severityCounts: countBySeverity(m.project.findings),
  }));
}

function countBySeverity(findings: { severity: string }[]) {
  const counts: Record<string, number> = {
    CRITICA: 0,
    ALTA: 0,
    MEDIA: 0,
    BAIXA: 0,
    INFORMATIVA: 0,
  };
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  }
  return counts;
}

export async function createProject(input: CreateProjectInput, gestorId: string) {
  const project = await prisma.project.create({
    data: {
      name: sanitizeRequiredText(input.name),
      description: sanitizeText(input.description),
      scope: sanitizeText(input.scope),
      members: {
        create: { userId: gestorId },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
  return project;
}

export async function getProjectById(projectId: string, userId: string) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      findings: {
        select: { id: true, title: true, severity: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { members: true, findings: true } },
    },
  });

  if (!project) return null;

  const statusSummary = await prisma.finding.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { id: true },
  });

  const severitySummary = await prisma.finding.groupBy({
    by: ['severity'],
    where: { projectId },
    _count: { id: true },
  });

  return {
    ...project,
    statusSummary: statusSummary.map((s) => ({ status: s.status, count: s._count.id })),
    severitySummary: severitySummary.map((s) => ({ severity: s.severity, count: s._count.id })),
  };
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: sanitizeRequiredText(input.name) }),
      ...(input.description !== undefined && { description: sanitizeText(input.description) }),
      ...(input.scope !== undefined && { scope: sanitizeText(input.scope) }),
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
    },
  });
}

export async function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } });
}

export async function addMember(projectId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  return prisma.projectMember.create({
    data: { projectId, userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export async function removeMember(projectId: string, userId: string) {
  return prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });
}

export async function getDashboardStats(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });

  const projectIds = memberships.map((m) => m.projectId);

  const [projectCount, findingCount, criticalOpen] = await Promise.all([
    prisma.project.count({ where: { id: { in: projectIds } } }),
    prisma.finding.count({ where: { projectId: { in: projectIds } } }),
    prisma.finding.count({
      where: {
        projectId: { in: projectIds },
        severity: 'CRITICA',
        status: { in: ['EM_ANALISE', 'VALIDADO'] },
      },
    }),
  ]);

  const recentProjects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { _count: { select: { findings: true, members: true } } },
  });

  return { projectCount, findingCount, criticalOpen, recentProjects };
}
