import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "../../config/upload";

const prisma = new PrismaClient();

export const getEvidences = async (incidentId: string) => {
    return await prisma.evidence.findMany({
        where: { incidentId },
        orderBy: { createdAt: "asc" },
    });
};

export const createEvidence = async (
    incidentId: string,
    uploadedBy: string,
    file: Express.Multer.File
) => {
    // Verify the incident exists
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new Error("NOT_FOUND");

    return await prisma.evidence.create({
        data: {
            incidentId,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedBy,
        },
    });
};

export const deleteEvidence = async (evidenceId: string, userId: string, userRole: string) => {
    const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) throw new Error("NOT_FOUND");
    if (evidence.uploadedBy !== userId && userRole !== "admin") throw new Error("FORBIDDEN");

    // Remove file from disk
    const filePath = path.join(UPLOAD_DIR, evidence.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    await prisma.evidence.delete({ where: { id: evidenceId } });
};

export const getEvidenceFilePath = async (evidenceId: string): Promise<{ filePath: string; mimetype: string; originalName: string }> => {
    const evidence = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!evidence) throw new Error("NOT_FOUND");

    const filePath = path.join(UPLOAD_DIR, evidence.filename);
    if (!fs.existsSync(filePath)) throw new Error("FILE_NOT_FOUND");

    return { filePath, mimetype: evidence.mimetype, originalName: evidence.originalName };
};
