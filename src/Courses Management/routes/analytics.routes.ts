import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Attendance tracking
router.post('/attendance/login', analyticsController.trackAttendance);
router.post('/attendance/logout', analyticsController.recordLogout);

// Learning outcome tracking
router.post('/learning-outcome', analyticsController.recordLearningOutcome);

// Content engagement tracking
router.post('/engagement', analyticsController.trackEngagement);

// User analytics
router.get('/user/:userId?', analyticsController.getUserAnalytics);

// Content analytics
router.get('/content/:contentType/:contentId', analyticsController.getContentAnalytics);

// System-wide analytics (admin only)
router.get('/system', authorize('admin'), analyticsController.getSystemAnalytics);

export default router;