import { Response } from 'express';
import { FindingStatus, Severity } from '@prisma/client';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as findingsService from './findings.service';
import * as attachmentsService from './attachments.service';

function handleError(res: Response, error: unknown): void {
  const err = error as Error & { statusCode?: number };
  const status = err.statusCode ?? 400;
  res.status(status).json({ error: err.message ?? 'Erro na operação.' });
}

export async function list(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const { projectId } = req.params;
  const filters = {
    status: req.query.status as FindingStatus | undefined,
    severity: req.query.severity as Severity | undefined,
    search: req.query.search as string | undefined,
  };

  const findings = await findingsService.listFindings(projectId, req.user.userId, filters);
  if (findings === null) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  res.json({ findings });
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.createFinding(
      req.params.projectId,
      req.user.userId,
      req.body
    );
    res.status(201).json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const finding = await findingsService.getFindingById(
    req.params.projectId,
    req.params.id,
    req.user.userId
  );
  if (!finding) {
    res.status(404).json({ error: 'Achado não encontrado.' });
    return;
  }
  res.json({ finding });
}

export async function update(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.updateFinding(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.user.role,
      req.body
    );
    res.json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

// NOVA FUNÇÃO: Deleção
export async function remove(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    await findingsService.deleteFinding(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.user.role
    );
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function changeStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.changeStatus(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.body.status
    );
    res.json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

export async function setPriority(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.setPriority(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.body.priority
    );
    res.json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

export async function assign(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.assignFinding(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.body.assignedToId
    );
    res.json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

export async function markDuplicate(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const finding = await findingsService.markDuplicate(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      req.body.duplicateOf
    );
    res.json({ finding });
  } catch (error) {
    handleError(res, error);
  }
}

export async function submitReview(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const review = await findingsService.submitPeerReview(
      req.params.findingId,
      req.user.userId,
      req.body.approved,
      req.body.comment
    );
    res.status(201).json({ review });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listReviews(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const reviews = await findingsService.listPeerReviews(req.params.findingId, req.user.userId);
  if (reviews === null) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  res.json({ reviews });
}

export async function uploadAttachments(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const attachments = await attachmentsService.saveAttachments(
      req.params.projectId,
      req.params.id,
      req.user.userId,
      files ?? []
    );
    res.status(201).json({ attachments });
  } catch (error) {
    handleError(res, error);
  }
}

export async function downloadAttachment(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  try {
    const attachment = await attachmentsService.getAttachmentFile(
      req.params.projectId,
      req.params.id,
      req.params.attachmentId,
      req.user.userId
    );
    if (!attachment) {
      res.status(404).json({ error: 'Anexo não encontrado.' });
      return;
    }
    res.download(attachment.storagePath, attachment.originalName);
  } catch (error) {
    handleError(res, error);
  }
}