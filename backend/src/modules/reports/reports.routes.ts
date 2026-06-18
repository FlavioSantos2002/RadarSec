import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireGestor } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { searchSchema } from './reports.schemas';
import * as reportsController from './reports.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/reports', reportsController.projectReport);
router.get('/export', requireGestor, reportsController.exportFindings);

const searchRouter = Router();
searchRouter.use(authMiddleware, requireGestor);
searchRouter.get('/', validate(searchSchema, 'query'), reportsController.search);

export { searchRouter };
export default router;
