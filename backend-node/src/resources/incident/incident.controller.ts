import { Request, Response } from "express";
import * as incidentService from "./incident.service";

export const getAllIncidentsAdmin = async (_req: Request, res: Response) => {
    try {
        const incidents = await incidentService.getAllIncidentsAdmin();
        res.status(200).json(incidents);
    } catch {
        res.status(500).json({ msg: "Erro interno ao listar todos os incidentes" });
    }
};

// GET /incidents?projectId=xxx
export const getIncidents = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;
        if (!projectId || typeof projectId !== "string") {
            res.status(400).json({ msg: "projectId é obrigatório como query param" });
            return;
        }
        const incidents = await incidentService.getIncidentsByProject(projectId);
        res.status(200).json(incidents);
    } catch {
        res.status(500).json({ msg: "Erro interno ao listar incidentes" });
    }
};

export const createIncident = async (req: Request, res: Response) => {
    try {
        const incident = await incidentService.createIncident(req.user!.userId, req.body);
        res.status(201).json(incident);
    } catch {
        res.status(500).json({ msg: "Erro ao registrar incidente" });
    }
};

export const getIncidentById = async (req: Request, res: Response) => {
    try {
        const incident = await incidentService.getIncidentById(req.params.id);
        res.status(200).json(incident);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Incidente não encontrado" });
        } else {
            res.status(500).json({ msg: "Erro interno no servidor" });
        }
    }
};

export const updateIncident = async (req: Request, res: Response) => {
    try {
        const incident = await incidentService.updateIncident(
            req.user!.userId,
            req.user!.role,
            req.params.id,
            req.body
        );
        res.status(200).json(incident);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Incidente não encontrado" });
        else if (error.message === "FORBIDDEN") res.status(403).json({ msg: "Sem permissão para editar este incidente" });
        else res.status(500).json({ msg: "Erro ao atualizar incidente" });
    }
};

export const deleteIncident = async (req: Request, res: Response) => {
    try {
        await incidentService.deleteIncident(req.user!.userId, req.user!.role, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Incidente não encontrado" });
        else if (error.message === "FORBIDDEN") res.status(403).json({ msg: "Sem permissão para excluir este incidente" });
        else res.status(500).json({ msg: "Erro interno no servidor" });
    }
};