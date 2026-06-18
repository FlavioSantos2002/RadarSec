import fs from 'fs';
import path from 'path';
import { Role } from '@prisma/client';
import prisma from '../../lib/prisma';
import { isProjectMember } from '../projects/projects.service';
import { UPLOAD_DIR } from './findings.upload';

export async function saveAttachments(
  projectId: string,
  findingId: string,
  userId: string,
  files: Express.Multer.File[]
) {
  const finding = await prisma.finding.findFirst({
    where: { id: findingId, projectId },
  });

  if (!finding) throw new Error('Achado não encontrado.');

  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) throw new Error('Acesso negado.');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado.');

  if (user.role === Role.HUNTER && finding.authorId !== userId) {
    throw new Error('Caçadores só podem anexar arquivos em seus próprios achados.');
  }

  if (!files.length) throw new Error('Nenhum arquivo enviado.');

  const findingDir = path.join(UPLOAD_DIR, projectId, findingId);
  fs.mkdirSync(findingDir, { recursive: true });

  const attachments = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const file of files) {
      const destPath = path.join(findingDir, path.basename(file.filename));
      fs.renameSync(file.path, destPath);

      const attachment = await tx.findingAttachment.create({
        data: {
          findingId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storagePath: destPath,
          uploadedById: userId,
        },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      });

      created.push(attachment);
    }

    return created;
  });

  return attachments;
}

export async function getAttachmentFile(
  projectId: string,
  findingId: string,
  attachmentId: string,
  userId: string
) {
  const isMember = await isProjectMember(projectId, userId);
  if (!isMember) return null;

  const attachment = await prisma.findingAttachment.findFirst({
    where: {
      id: attachmentId,
      findingId,
      finding: { projectId },
    },
  });

  if (!attachment) return null;

  if (!fs.existsSync(attachment.storagePath)) {
    throw new Error('Arquivo não encontrado no servidor.');
  }

  return attachment;
}
