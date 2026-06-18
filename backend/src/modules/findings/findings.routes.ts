import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireGestor, requireRole } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  createFindingSchema,
  updateFindingSchema,
  statusChangeSchema,
  priorityChangeSchema,
  assignSchema,
  duplicateSchema,
  peerReviewSchema,
} from './findings.schemas';
import * as findingsController from './findings.controller';
import { uploadAttachments as uploadMiddleware, translateUploadError } from './findings.upload';

const router = Router({ mergeParams: true });

// Proteção global para estas rotas
router.use(authMiddleware);

// Listagem e Criação
router.get('/', findingsController.list);
router.post('/', requireRole(Role.HUNTER), validate(createFindingSchema), findingsController.create);

// Operações de Leitura, Edição e Exclusão por ID
router.get('/:id', findingsController.getById);
router.patch('/:id', validate(updateFindingSchema), findingsController.update); // Edição
router.delete('/:id', findingsController.remove); // Exclusão

// Anexos
router.post(
  '/:id/attachments',
  requireRole(Role.HUNTER),
  (req, res, next) => {
    uploadMiddleware.array('attachments', 5)(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: translateUploadError(err.message) });
        return;
      }
      next();
    });
  },
  findingsController.uploadAttachments
);
router.get('/:id/attachments/:attachmentId', findingsController.downloadAttachment);

// Atualizações de estado específicas
router.patch('/:id/status', validate(statusChangeSchema), findingsController.changeStatus);
router.patch('/:id/priority', requireGestor, validate(priorityChangeSchema), findingsController.setPriority);
router.patch('/:id/assign', requireGestor, validate(assignSchema), findingsController.assign);
router.patch('/:id/duplicate', validate(duplicateSchema), findingsController.markDuplicate);

export default router;

// Rotas de Peer Review
const reviewsRouter = Router({ mergeParams: true });

reviewsRouter.use(authMiddleware);
reviewsRouter.post('/:findingId/reviews', validate(peerReviewSchema), findingsController.submitReview);
reviewsRouter.get('/:findingId/reviews', findingsController.listReviews);

export { reviewsRouter };