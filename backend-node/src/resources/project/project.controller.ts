import { Request, Response } from "express";
import * as projectService from "./project.service";

export const getAllProjects = async (_req: Request, res: Response) => {
    try {
        const projects = await projectService.getAllProjects();
        res.status(200).json(projects);
    } catch {
        res.status(500).json({ msg: "Erro ao listar projetos" });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const project = await projectService.getProjectById(req.params.id);
        res.status(200).json(project);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Projeto não encontrado" });
        } else {
            res.status(500).json({ msg: "Erro interno" });
        }
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const project = await projectService.createProject(req.user!.userId, req.body);
        res.status(201).json(project);
    } catch {
        res.status(500).json({ msg: "Erro ao criar projeto" });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const project = await projectService.updateProject(
            req.user!.userId,
            req.user!.role,
            req.params.id,
            req.body
        );
        res.status(200).json(project);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Projeto não encontrado" });
        else if (error.message === "FORBIDDEN") res.status(403).json({ msg: "Sem permissão para editar este projeto" });
        else res.status(500).json({ msg: "Erro ao atualizar projeto" });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        await projectService.deleteProject(req.user!.userId, req.user!.role, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Projeto não encontrado" });
        else if (error.message === "FORBIDDEN") res.status(403).json({ msg: "Sem permissão para excluir este projeto" });
        else res.status(500).json({ msg: "Erro ao excluir projeto" });
    }
};
