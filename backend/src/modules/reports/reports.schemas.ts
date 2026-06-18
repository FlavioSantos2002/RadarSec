import { z } from 'zod';

export const searchSchema = z.object({
  q: z.string().min(1, 'Termo de busca é obrigatório.'),
  projectId: z.string().uuid('ID de projeto inválido.').optional(),
});

export const exportSchema = z.object({
  format: z.enum(['json', 'csv'], { message: 'Formato de exportação inválido.' }).default('json'),
});
