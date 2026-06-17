import { Request, Response } from "express";
import * as evidenceService from "./evidence.service";

export const getEvidences = async (req: Request, res: Response) => {
    try {
        const evidences = await evidenceService.getEvidences(req.params.id);
        res.status(200).json(evidences);
    } catch {
        res.status(500).json({ msg: "Erro ao listar evidências" });
    }
};

export const uploadEvidence = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ msg: "Nenhum arquivo enviado" });
            return;
        }
        const evidence = await evidenceService.createEvidence(
            req.params.id,
            req.user!.userId,
            req.file
        );
        res.status(201).json(evidence);
    } catch (error: any) {
        if (error.message === "NOT_FOUND") {
            res.status(404).json({ msg: "Incidente não encontrado" });
        } else {
            res.status(500).json({ msg: "Erro ao salvar evidência" });
        }
    }
};

export const deleteEvidence = async (req: Request, res: Response) => {
    try {
        await evidenceService.deleteEvidence(req.params.id, req.user!.userId, req.user!.role);
        res.status(204).send();
    } catch (error: any) {
        if (error.message === "NOT_FOUND") res.status(404).json({ msg: "Evidência não encontrada" });
        else if (error.message === "FORBIDDEN") res.status(403).json({ msg: "Sem permissão para excluir esta evidência" });
        else res.status(500).json({ msg: "Erro ao excluir evidência" });
    }
};

export const downloadEvidence = async (req: Request, res: Response) => {
    try {
        const { filePath, mimetype, originalName } = await evidenceService.getEvidenceFilePath(req.params.id);
        res.setHeader("Content-Type", mimetype);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(originalName)}"`);
        res.sendFile(filePath);
    } catch (error: any) {
        if (error.message === "NOT_FOUND" || error.message === "FILE_NOT_FOUND") {
            res.status(404).json({ msg: "Arquivo não encontrado" });
        } else {
            res.status(500).json({ msg: "Erro ao servir arquivo" });
        }
    }
};
