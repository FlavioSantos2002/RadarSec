import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

// URL do container de IA
const AI_API_URL = process.env.AI_API_URL || "http://backend-ia:8000";

export const getAllIncidentsAdmin = async () => {
    return await prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, email: true, fullname: true, role: true } } },
    });
};

export const getAllIncidents = async (userId: string) => {
    return await prisma.incident.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};

export const createIncident = async (userId: string, data: { title: string; description: string }) => {
    let category = "processando";

    try {
        // CORREÇÃO: Enviando objeto completo { title, description } para evitar erro 422
        const aiResponse = await axios.post(`${AI_API_URL}/classificar`, {
            title: data.title,
            description: data.description
        });
        
        // CORREÇÃO: Acessando a chave "categoria" que vem do seu app.py
        category = aiResponse.data.categoria;
    } catch (error) {
        console.error("Erro na classificação inicial (IA):", error);
    }

    return await prisma.incident.create({
        data: {
            title: data.title,
            description: data.description,
            category: category,
            userId
        }
    });
};

export const getIncidentById = async (userId: string, incidentId: string) => {
    const incident = await prisma.incident.findFirst({
        where: { id: incidentId, userId }
    });

    if (!incident) throw new Error("NOT_FOUND");
    return incident;
};

export const updateIncident = async (userId: string, incidentId: string, data: { title: string; description: string }) => {
    const existing = await prisma.incident.findFirst({
        where: { id: incidentId, userId }
    });

    if (!existing) throw new Error("NOT_FOUND");

    let newCategory = existing.category;
    
    try {
        // CORREÇÃO: Enviando title e description na atualização também
        const aiResponse = await axios.post(`${AI_API_URL}/classificar`, {
            title: data.title,
            description: data.description
        });
        
        // CORREÇÃO: Lendo a chave correta do Python
        newCategory = aiResponse.data.categoria;
    } catch (error) {
        console.error("Falha na reclassificação (IA):", error);
    }

    return await prisma.incident.update({
        where: { id: incidentId },
        data: {
            title: data.title,
            description: data.description,
            category: newCategory
        }
    });
};

export const deleteIncident = async (userId: string, incidentId: string) => {
    const existing = await prisma.incident.findFirst({
        where: { id: incidentId, userId }
    });

    if (!existing) throw new Error("NOT_FOUND");

    return await prisma.incident.delete({
        where: { id: incidentId }
    });
};