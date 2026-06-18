import { FindingStatus, Priority, Role, Severity } from '@prisma/client';
import prisma from '../../lib/prisma';
import { sanitizeRequiredText, sanitizeText } from '../../utils/sanitize.util';
import { validateCvssScore } from '../../utils/cvss.util';
import { isProjectMember } from '../projects/projects.service';
import {
  CreateFindingInput,
  UpdateFindingInput,
} from './findings.schemas';

const TEXT_FIELDS = ['title', 'description', 'attackVector', 'payload', 'poc', 'evidences'] as const;

function sanitizeFindingInput<T extends Record<string, unknown>>(input: T): T {
  const result = { ...input };
  for (const field of TEXT_FIELDS) {
    if (field in result && typeof result[field] === 'string') {
      (result[field] as unknown) =
        field === 'title' || field === 'description' || field === 'attackVector'
          ? sanitizeRequiredText(result[field] as string)
          : sanitizeText(result[field] as string);
    }
  }
  return result;
}

const findingInclude = {
  author: { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  peerReviews: {
    include: { reviewer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  auditLogs: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  attachments: {
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
};

export async function listFindings(
  projectId: string,
  userId: string,
  filters: { status?: FindingStatus; severity?: Severity; search?: string }
) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  const where: {
    projectId: string;
    status?: FindingStatus;
    severity?: Severity;
    OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
  } = { projectId };

  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.finding.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFinding(
  projectId: string,
  authorId: string,
  input: CreateFindingInput
) {
  const isMember = await isProjectMember(projectId, authorId);
  if (!isMember) throw new Error('Acesso negado ao projeto.');

  if (input.cvssScore !== undefined && input.cvssScore !== null && !validateCvssScore(input.cvssScore)) {
    throw new Error('Nota CVSS deve estar entre 0.0 e 10.0.');
  }

  const sanitized = sanitizeFindingInput(input);

  return prisma.finding.create({
    data: {
      ...sanitized,
      projectId,
      authorId,
    },
    include: findingInclude,
  });
}

export async function getFindingById(
  projectId: string,
  findingId: string,
  userId: string
) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  return prisma.finding.findFirst({
    where: { id: findingId, projectId },
    include: findingInclude,
  });
}

export async function updateFinding(
  projectId: string,
  findingId: string,
  userId: string,
  userRole: Role,
  input: UpdateFindingInput
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) throw new Error('Acesso negado.');

  if (userRole === Role.HUNTER && finding.authorId !== userId) {
    throw new Error('Caçadores só podem editar seus próprios achados.');
  }

  if (input.cvssScore !== undefined && input.cvssScore !== null && !validateCvssScore(input.cvssScore)) {
    throw new Error('Nota CVSS deve estar entre 0.0 e 10.0.');
  }

  const sanitized = sanitizeFindingInput(input);

  return prisma.finding.update({
    where: { id: findingId },
    data: sanitized,
    include: findingInclude,
  });
}

export async function deleteFinding(
  projectId: string,
  findingId: string,
  userId: string,
  userRole: Role
) {
  // 1. Busca o achado para validação
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  // 2. Validação de Permissão: Apenas Autor ou Gestor podem excluir
  if (userRole !== Role.GESTOR && finding.authorId !== userId) {
    const error = new Error('Você não tem permissão para excluir este achado.');
    (error as any).statusCode = 403;
    throw error;
  }

  // 3. Execução em transação para garantir integridade
  return await prisma.$transaction(async (tx) => {
    // Remove registros relacionados
    await tx.peerReview.deleteMany({ where: { findingId } });
    await tx.auditLog.deleteMany({ where: { findingId } });
    
    // CORREÇÃO: Utilizando o nome correto do modelo 'findingAttachment'
    await tx.findingAttachment.deleteMany({ where: { findingId } });

    // Deleta o achado principal
    return await tx.finding.delete({
      where: { id: findingId },
    });
  });
}

async function validatePeerReviewForValidation(findingId: string, authorId: string): Promise<boolean> {
  const approvedReview = await prisma.peerReview.findFirst({
    where: {
      findingId,
      approved: true,
      reviewerId: { not: authorId },
      reviewer: { role: Role.HUNTER },
    },
  });
  return !!approvedReview;
}

export async function changeStatus(
  projectId: string,
  findingId: string,
  userId: string,
  newStatus: FindingStatus
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) throw new Error('Acesso negado.');

  if (newStatus === FindingStatus.VALIDADO) {
    const hasApprovedReview = await validatePeerReviewForValidation(findingId, finding.authorId);
    if (!hasApprovedReview) {
      const error = new Error(
        'Achado requer revisão entre pares aprovada por outro caçador antes de ser validado.'
      );
      (error as Error & { statusCode: number }).statusCode = 422;
      throw error;
    }
  }

  const previousStatus = finding.status;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.finding.update({
      where: { id: findingId },
      data: { status: newStatus },
      include: findingInclude,
    });

    await tx.auditLog.create({
      data: {
        userId,
        findingId,
        action: 'STATUS_CHANGED',
        previousValue: previousStatus,
        newValue: newStatus,
      },
    });

    return result;
  });

  return updated;
}

export async function setPriority(
  projectId: string,
  findingId: string,
  userId: string,
  priority: Priority
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const previousPriority = finding.priority ?? null;

  return prisma.$transaction(async (tx) => {
    const result = await tx.finding.update({
      where: { id: findingId },
      data: { priority },
      include: findingInclude,
    });

    await tx.auditLog.create({
      data: {
        userId,
        findingId,
        action: 'PRIORITY_SET',
        previousValue: previousPriority,
        newValue: priority,
      },
    });

    return result;
  });
}

export async function assignFinding(
  projectId: string,
  findingId: string,
  userId: string,
  assignedToId: string
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const hunterMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: assignedToId },
    include: { user: true },
  });

  if (!hunterMember) throw new Error('Usuário não é membro do projeto.');

  const previousAssignee = finding.assignedToId ?? null;

  return prisma.$transaction(async (tx) => {
    const result = await tx.finding.update({
      where: { id: findingId },
      data: { assignedToId },
      include: findingInclude,
    });

    await tx.auditLog.create({
      data: {
        userId,
        findingId,
        action: 'FINDING_REASSIGNED',
        previousValue: previousAssignee,
        newValue: assignedToId,
      },
    });

    return result;
  });
}

export async function markDuplicate(
  projectId: string,
  findingId: string,
  userId: string,
  duplicateOf: string
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const original = await prisma.finding.findFirst({
    where: { id: duplicateOf, projectId },
  });

  if (!original) {
    throw new Error('Achado original não encontrado ou pertence a outro projeto.');
  }

  if (duplicateOf === findingId) {
    throw new Error('Um achado não pode ser duplicata de si mesmo.');
  }

  const previousStatus = finding.status;

  return prisma.$transaction(async (tx) => {
    const result = await tx.finding.update({
      where: { id: findingId },
      data: {
        status: FindingStatus.DUPLICADO,
        isDuplicate: true,
        duplicateOf,
      },
      include: findingInclude,
    });

    await tx.auditLog.create({
      data: {
        userId,
        findingId,
        action: 'STATUS_CHANGED',
        previousValue: previousStatus,
        newValue: FindingStatus.DUPLICADO,
      },
    });

    return result;
  });
}

export async function submitPeerReview(
  findingId: string,
  reviewerId: string,
  approved: boolean,
  comment?: string
) {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { project: { include: { members: true } } },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const isMember = finding.project.members.some((m) => m.userId === reviewerId);
  if (!isMember) throw new Error('Acesso negado.');

  if (finding.authorId === reviewerId) {
    throw new Error('Você não pode revisar seu próprio achado.');
  }

  const sanitizedComment = comment ? sanitizeText(comment) : null;

  const review = await prisma.$transaction(async (tx) => {
    const result = await tx.peerReview.upsert({
      where: { findingId_reviewerId: { findingId, reviewerId } },
      create: {
        findingId,
        reviewerId,
        approved,
        comment: sanitizedComment,
      },
      update: {
        approved,
        comment: sanitizedComment,
      },
      include: { reviewer: { select: { id: true, name: true, email: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId: reviewerId,
        findingId,
        action: 'PEER_REVIEW_ADDED',
        previousValue: null,
        newValue: approved ? 'APROVADO' : 'REPROVADO',
      },
    });

    return result;
  });

  return review;
}

export async function listPeerReviews(findingId: string, userId: string) {
  const finding = await prisma.finding.findUnique({
    where: { id: findingId },
    include: { project: { include: { members: true } } },
  });

  if (!finding) return null;

  const isMember = finding.project.members.some((m) => m.userId === userId);
  if (!isMember) return null;

  return prisma.peerReview.findMany({
    where: { findingId },
    include: { reviewer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFindingAuditLogs(findingId: string) {
  return prisma.auditLog.findMany({
    where: { findingId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
