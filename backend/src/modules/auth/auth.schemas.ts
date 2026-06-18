import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
  role: z.nativeEnum(Role, { message: 'Perfil inválido.' }).optional().default(Role.HUNTER),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
