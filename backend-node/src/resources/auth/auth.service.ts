import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignupDto, LoginDto } from "./auth.types";

const prisma = new PrismaClient();

export const signup = async (data: SignupDto) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullname: data.fullname,
      password: hashedPassword,
    },
  });

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data: LoginDto) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  
  // Proteção contra timing attack: executa o bcrypt independente de o e-mail existir
  const passwordMatch = await bcrypt.compare(
    data.password, 
    user ? user.password : await bcrypt.hash("dummy_password", 10)
  );

  if (!user || !passwordMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user;
};