import { z } from 'zod';
import { FindingStatus, Severity, Priority } from '@prisma/client';

const enumMessage = (label: string) => ({ message: `${label} inválido(a).` });

export const createFindingSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório.'),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  attackVector: z.string().min(1, 'Vetor de ataque é obrigatório.'),
  payload: z.string().optional(),
  poc: z.string().optional(),
  severity: z.nativeEnum(Severity, enumMessage('Severidade')),
  cvssScore: z
    .number({ message: 'Nota CVSS deve ser um número.' })
    .min(0, 'Nota CVSS deve ser no mínimo 0.')
    .max(10, 'Nota CVSS deve ser no máximo 10.')
    .optional()
    .nullable(),
  cvssVector: z.string().optional().nullable(),
  evidences: z.string().optional(),
});

export const updateFindingSchema = createFindingSchema.partial();

export const statusChangeSchema = z.object({
  status: z.nativeEnum(FindingStatus, enumMessage('Status')),
});

export const priorityChangeSchema = z.object({
  priority: z.nativeEnum(Priority, enumMessage('Prioridade')),
});

export const assignSchema = z.object({
  assignedToId: z.string().uuid('ID de usuário inválido.'),
});

export const duplicateSchema = z.object({
  duplicateOf: z.string().uuid('ID do achado original inválido.'),
});

export const peerReviewSchema = z.object({
  approved: z.boolean(),
  comment: z.string().optional(),
});

export const findingFiltersSchema = z.object({
  status: z.nativeEnum(FindingStatus, enumMessage('Status')).optional(),
  severity: z.nativeEnum(Severity, enumMessage('Severidade')).optional(),
  search: z.string().optional(),
});

export type CreateFindingInput = z.infer<typeof createFindingSchema>;
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;
