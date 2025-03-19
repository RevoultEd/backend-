import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import courseRoutes from '../Courses Management/routes/index';
import uploadRoutes from '../Content_Upload/routes/index';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', authenticateToken, userRoutes);
router.use('/courses', authenticateToken, courseRoutes);
router.use('/upload', authenticateToken, uploadRoutes);

export default router;