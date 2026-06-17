import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INCIDENT_INCLUDE = {
    user: { select: { id: true, email: true, fullname: true } },
    responsible: { select: { id: true, email: true, fullname: true } },
    project: { select: { id: true, name: true } },
    _count: { select: { evidences: true } },
} as const;

export const getAllIncidentsAdmin = async () => {
    return await prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        include: INCIDENT_INCLUDE,
    });
};

export const getIncidentsByProject = async (projectId: string) => {
    return await prisma.incident.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        include: INCIDENT_INCLUDE,
    });
};

export const createIncident = async (
    userId: string,
    data: {
        projectId: string;
        title: string;
        description: string;
        category: string;
        severity?: string;
        status?: string;
        responsibleId?: string | null;
    }
) => {
    return await prisma.incident.create({
        data: {
            projectId: data.projectId,
            title: data.title,
            description: data.description,
            category: data.category,
            severity: data.severity || "baixa",
            status: data.status || "aberto",
            responsibleId: data.responsibleId || null,
            userId,
        },
        include: INCIDENT_INCLUDE,
    });
};

export const getIncidentById = async (incidentId: string) => {
    const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: INCIDENT_INCLUDE,
    });
    if (!incident) throw new Error("NOT_FOUND");
    return incident;
};

export const updateIncident = async (
    userId: string,
    userRole: string,
    incidentId: string,
    data: {
        title?: string;
        description?: string;
        category?: string;
        severity?: string;
        status?: string;
        responsibleId?: string | null;
    }
) => {
    const existing = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId && userRole !== "admin") throw new Error("FORBIDDEN");

    return await prisma.incident.update({
        where: { id: incidentId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.category && { category: data.category }),
            ...(data.severity && { severity: data.severity }),
            ...(data.status && { status: data.status }),
            ...("responsibleId" in data && { responsibleId: data.responsibleId || null }),
        },
        include: INCIDENT_INCLUDE,
    });
};

export const deleteIncident = async (userId: string, userRole: string, incidentId: string) => {
    const existing = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId && userRole !== "admin") throw new Error("FORBIDDEN");

    await prisma.incident.delete({ where: { id: incidentId } });
};
