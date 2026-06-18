import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  scope: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').optional(),
  description: z.string().optional(),
  scope: z.string().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido.'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
