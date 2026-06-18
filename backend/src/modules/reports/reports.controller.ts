import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as reportsService from './reports.service';

export async function projectReport(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const report = await reportsService.getProjectReport(req.params.projectId, req.user.userId);
  if (!report) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  res.json({ report });
}

export async function exportFindings(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const format = (req.query.format as 'json' | 'csv') ?? 'json';
  const result = await reportsService.exportFindings(
    req.params.projectId,
    req.user.userId,
    format
  );

  if (!result) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }

  if (result.type === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="achados-${req.params.projectId}.csv"`);
    res.send(result.data);
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="achados-${req.params.projectId}.json"`);
  res.json(result.data);
}

export async function search(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) return;
  const q = req.query.q as string;
  const projectId = req.query.projectId as string | undefined;

  const results = await reportsService.globalSearch(req.user.userId, q, projectId);
  res.json({ results });
}
