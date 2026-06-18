import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { timelineMessageSchema } from './timeline.schemas';
import * as timelineController from './timeline.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:findingId/timeline', timelineController.list);
router.post('/:findingId/timeline', validate(timelineMessageSchema), timelineController.create);

export default router;
