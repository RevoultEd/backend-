import { Router } from 'express';
import { oerIntegrationController } from '../controllers/oer-integration.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/integrate', authenticateToken, authorize('admin'), oerIntegrationController.integrateOERResources);
router.post('/filter', authenticateToken, oerIntegrationController.filterResourcesByCurriculum);
router.post('/course/:courseId/add-resources', authenticateToken, authorize('admin', 'teacher'), oerIntegrationController.addOERResourcesToCourse);

export default router;