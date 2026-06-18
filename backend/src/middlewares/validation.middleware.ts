import { Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AuthRequest } from './auth.middleware';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      (req as AuthRequest & Record<string, unknown>)[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Log para ajudar a debugar no terminal do Docker
        console.error(`[Zod Error - ${target}]:`, JSON.stringify(error.errors, null, 2));

        res.status(400).json({
          error: 'Dados inválidos.',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}