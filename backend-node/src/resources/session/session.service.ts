import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sessionInclude = {
  director: { select: { id: true, fullname: true } },
  scenes: {
    orderBy: { order: "asc" as const },
    include: {
      choices: {
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  },
};

export const getAllSessions = async () => {
  return await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      director: { select: { id: true, fullname: true } },
      _count: { select: { scenes: true } },
    },
  });
};

export const getSessionById = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });
  if (!session) throw new Error("NOT_FOUND");
  return session;
};

export const createSession = async (
  directorId: string,
  data: { title: string; description: string }
) => {
  return await prisma.session.create({ data: { ...data, directorId } });
};

export const updateSessionStatus = async (
  userId: string,
  sessionId: string,
  status: string
) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, directorId: userId },
  });
  if (!session) throw new Error("NOT_FOUND");

  // Se encerrar, desativa todas as cenas
  if (status === "finished") {
    await prisma.scene.updateMany({ where: { sessionId }, data: { isActive: false } });
  }

  return await prisma.session.update({ where: { id: sessionId }, data: { status } });
};

export const deleteSession = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, directorId: userId },
  });
  if (!session) throw new Error("NOT_FOUND");
  return await prisma.session.delete({ where: { id: sessionId } });
};

export const addScene = async (
  userId: string,
  sessionId: string,
  data: { title: string; content: string; choices: string[] }
) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, directorId: userId },
  });
  if (!session) throw new Error("NOT_FOUND");

  const lastScene = await prisma.scene.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
  });
  const order = lastScene ? lastScene.order + 1 : 1;

  return await prisma.scene.create({
    data: {
      sessionId,
      title: data.title,
      content: data.content,
      order,
      choices: { create: data.choices.map((text) => ({ text })) },
    },
    include: { choices: true },
  });
};

export const activateScene = async (sessionId: string, sceneId: string) => {
  const scene = await prisma.scene.findFirst({ where: { id: sceneId, sessionId } });
  if (!scene) throw new Error("NOT_FOUND");

  // Desativa todas as cenas da sessão e ativa somente a escolhida
  await prisma.scene.updateMany({ where: { sessionId }, data: { isActive: false } });

  return await prisma.scene.update({
    where: { id: sceneId },
    data: { isActive: true },
    include: {
      choices: { include: { _count: { select: { votes: true } } } },
    },
  });
};

export const castVote = async (
  userId: string,
  sceneId: string,
  choiceId: string
) => {
  const choice = await prisma.choice.findFirst({ where: { id: choiceId, sceneId } });
  if (!choice) throw new Error("INVALID_CHOICE");

  const scene = await prisma.scene.findFirst({ where: { id: sceneId, isActive: true } });
  if (!scene) throw new Error("SCENE_NOT_ACTIVE");

  return await prisma.vote.create({ data: { userId, sceneId, choiceId } });
};
