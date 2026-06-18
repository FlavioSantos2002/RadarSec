import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireGestor } from '../../middlewares/role.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from './projects.schemas';
import * as projectsController from './projects.controller';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', projectsController.dashboard);
router.get('/', projectsController.list);
router.post('/', requireGestor, validate(createProjectSchema), projectsController.create);
router.get('/:id', projectsController.getById);
router.put('/:id', requireGestor, validate(updateProjectSchema), projectsController.update);
router.delete('/:id', requireGestor, projectsController.remove);
router.post('/:id/members', requireGestor, validate(addMemberSchema), projectsController.addMember);
router.delete('/:id/members/:userId', requireGestor, projectsController.removeMember);

export default router;
