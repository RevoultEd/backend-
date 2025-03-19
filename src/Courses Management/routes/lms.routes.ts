import { Router } from 'express';
import { lmsController } from '../controllers/lms.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';

const router = Router();

// User synchronization routes
router.post('/sync/user', authenticateToken, lmsController.syncUser);
router.post('/sync/user/:userId', authenticateToken, authorize('admin'), lmsController.syncSpecificUser);

// Course synchronization routes
router.post('/sync/courses', authenticateToken, authorize('admin'), lmsController.syncCourses);
router.get('/', authenticateToken, lmsController.getUnifiedCourses);

export default router;