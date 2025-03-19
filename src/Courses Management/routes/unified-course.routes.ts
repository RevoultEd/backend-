import { Router } from 'express';
import { unifiedCourseController } from '../controllers/unified-course.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', unifiedCourseController.getCourses);
router.get('/stats', authenticateToken, authorize('admin', 'teacher'), unifiedCourseController.getCourseStats);
router.get('/:id', unifiedCourseController.getCourseById);

export default router;