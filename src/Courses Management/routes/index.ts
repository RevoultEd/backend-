import { Router } from 'express';
import lmsRoutes from './lms.routes';
import oerRoutes from './oer.routes';
import languageRoutes from './language.routes';
import unifiedCourseRoutes from './unified-course.routes';
import curriculumRoutes from './curriculum.routes';
import oerIntegrationRoutes from './oer-integration.routes';
import offlineSyncRoutes from './offline-sync.routes';
import analyticsRoutes from './analytics.routes';
import { setLanguagePreference } from '../../middleware/language.middleware';

const router = Router();

router.use(setLanguagePreference);
router.use('/lms', lmsRoutes);
router.use('/oer', oerRoutes);
router.use('/language', languageRoutes);
router.use('/courses', unifiedCourseRoutes);
router.use('/curriculum', curriculumRoutes);
router.use('/oer-integration', oerIntegrationRoutes);
router.use('/offline-sync', offlineSyncRoutes);
router.use('/analytics', analyticsRoutes);

export default router;