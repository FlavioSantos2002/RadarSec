import { PrismaClient } from "@prisma/client";
import { CreateProjectDto, UpdateProjectDto } from "./project.types";

const prisma = new PrismaClient();

export const getAllProjects = async () => {
    return await prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            owner: { select: { id: true, email: true, fullname: true } },
            _count: { select: { incidents: true } },
        },
    });
};

export const getProjectById = async (projectId: string) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            owner: { select: { id: true, email: true, fullname: true } },
            _count: { select: { incidents: true } },
        },
    });
    if (!project) throw new Error("NOT_FOUND");
    return project;
};

export const createProject = async (ownerId: string, data: CreateProjectDto) => {
    return await prisma.project.create({
        data: {
            name: data.name,
            description: data.description,
            ownerId,
        },
        include: {
            owner: { select: { id: true, email: true, fullname: true } },
        },
    });
};

export const updateProject = async (
    userId: string,
    userRole: string,
    projectId: string,
    data: UpdateProjectDto
) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("NOT_FOUND");
    if (project.ownerId !== userId && userRole !== "admin") throw new Error("FORBIDDEN");

    return await prisma.project.update({
        where: { id: projectId },
        data,
        include: {
            owner: { select: { id: true, email: true, fullname: true } },
        },
    });
};

export const deleteProject = async (userId: string, userRole: string, projectId: string) => {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error("NOT_FOUND");
    if (project.ownerId !== userId && userRole !== "admin") throw new Error("FORBIDDEN");

    await prisma.project.delete({ where: { id: projectId } });
};
