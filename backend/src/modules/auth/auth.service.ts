import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import prisma from '../../lib/prisma';
import { signToken } from '../../middlewares/auth.middleware';
import { sanitizeRequiredText } from '../../utils/sanitize.util';
import { RegisterInput, LoginInput } from './auth.schemas';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new Error('E-mail já cadastrado.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const name = sanitizeRequiredText(input.name);

  const user = await prisma.user.create({
    data: {
      name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: Role.HUNTER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return { user: toSafeUser(user), token };
}

export async function loginUser(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new Error('Credenciais inválidas.');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Credenciais inválidas.');
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return {
    user: toSafeUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }),
    token,
  };
}

export async function getUserById(userId: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user ? toSafeUser(user) : null;
}
