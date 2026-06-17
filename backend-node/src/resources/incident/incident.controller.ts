import { Request, Response } from "express";
import * as incidentService from "./incident.service";

// Listar todos os incidentes (admin: todos; user: só os seus)
export const getAllIncidentsAdmin = async (_req: Request, res: Response) => {
    try {
        const incidents = await incidentService.getAllIncidentsAdmin();
        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({ msg: "Erro interno ao listar todos os incidentes" });
    }
};

export const getAllIncidents = async (req: Request, res: Response) => {
    try {
        const incidents = await incidentService.getAllIncidents(req.user!.userId);
        res.status(200).json(incidents);
    } catch (error) {
        res.status(500).json({ msg: "Erro interno no servidor ao listar incidentes" });
    }
};

// Criar um novo incidente (com classificação inicial da IA no Service)
export const createIncident = async (req: Request, res: Response) => {
    try {
        const incident = await incidentService.createIncident(req.user!.userId, req.body);
        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({ msg: "Erro ao registrar incidente" });
    }
};

// Buscar um incidente específico por ID
export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const incident = await incidentService.getIncidentById(req.user!.userId, req.params.id);
        res.status(200).json(incident);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Incidente não encontrado ou permissão negada" });
        } else {
            res.status(500).json({ msg: "Erro interno no servidor" });
        }
    }
};

// Editar incidente e disparar reclassificação
export const updateIncident = async (req: Request, res: Response) => {
    try {
        // Passamos o userId da sessão, o ID da URL e o corpo da requisição
        const incident = await incidentService.updateIncident(
            req.user!.userId, 
            req.params.id, 
            req.body
        );
        res.status(200).json(incident);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Incidente não encontrado ou não pertence ao usuário" });
        } else {
            console.error("Erro no Controller Update:", error);
            res.status(500).json({ msg: "Erro ao atualizar e reclassificar o incidente" });
        }
    }
};

// Excluir incidente
export const deleteIncident = async (req: Request, res: Response) => {
    try {
        await incidentService.deleteIncident(req.user!.userId, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Incidente não encontrado ou não pertence ao usuário" });
        } else {
            res.status(500).json({ msg: "Erro interno no servidor" });
        }
    }
};