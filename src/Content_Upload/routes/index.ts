import { Router } from 'express';
import badgeRoutes from './badge.routes';
import contentRoutes from './content.routes';
import { rateLimiter } from '../../middleware/auth.middleware';

const router = Router();

const standardLimit = rateLimiter(20, 15 * 60 * 1000);

router.use(standardLimit);
router.use('/badge', badgeRoutes);
router.use('/content', contentRoutes);

export default router;