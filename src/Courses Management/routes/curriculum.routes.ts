import { Router } from 'express';
import { curriculumController } from '../controllers/curriculum.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.get('/topics', curriculumController.getTopicsBySubject);
router.get('/courses', curriculumController.findCoursesByCurriculum);
router.get('/stats', authenticateToken, authorize('admin', 'teacher'), curriculumController.getCurriculumStats);
router.post('/tag/:courseId', authenticateToken, authorize('admin', 'teacher'), curriculumController.tagCourse);

export default router;