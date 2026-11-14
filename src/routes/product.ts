import { Router } from 'express';
import ProductController from '../product/controllers/ProductController.js';

const router = Router();

router.get('/', ProductController.list);
router.post('/', ProductController.create);
router.get('/:id', ProductController.getOne);

export default router;
