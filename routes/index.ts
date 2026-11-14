import { Router, type Request, type Response } from 'express';
import ResponseService from '../src/util/response.js';
import productRoutes from './product.js';
import userRoutes from './user.js';

const router = Router();

const health = (_req: Request, res: Response): Response =>
  ResponseService.json(res, 200, 'Service is up', { version: '1.0.0' });

router.get('/', health);
router.get('/health', health);

router.use('/products', productRoutes);
router.use('/users', userRoutes);

export default router;
