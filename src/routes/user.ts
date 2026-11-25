import { Router } from 'express';
import UserController from '../user/controllers/UserController.js';

// TODO(auth): these are admin operations. Once auth lands, move them under /admin and gate
// them with authMiddleware + requireRole(Role.ADMIN), as branda-core-api does.
const router = Router();

router.get('/', UserController.list);
router.post('/', UserController.create);
router.get('/:id', UserController.getOne);
router.patch('/:id', UserController.update);
router.delete('/:id', UserController.remove);

export default router;
