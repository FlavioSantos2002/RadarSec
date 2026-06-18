import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

export interface AuditContext {
  findingId: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
}

export async function createAuditLog(
  userId: string,
  ctx: AuditContext
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      findingId: ctx.findingId,
      action: ctx.action,
      previousValue: ctx.previousValue,
      newValue: ctx.newValue,
    },
  });
}

export function auditMiddleware(action: string) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const findingId =
          (req.params.id as string | undefined) ??
          (req.params.findingId as string | undefined);

        if (findingId && (req as AuthRequest & { auditContext?: AuditContext }).auditContext) {
          const ctx = (req as AuthRequest & { auditContext: AuditContext }).auditContext;
          createAuditLog(req.user.userId, ctx).catch(console.error);
        }
      }
      return originalJson(body);
    };

    (req as AuthRequest & { auditAction?: string }).auditAction = action;
    next();
  };
}

export function setAuditContext(
  req: AuthRequest,
  ctx: AuditContext
): void {
  (req as AuthRequest & { auditContext: AuditContext }).auditContext = ctx;
}
