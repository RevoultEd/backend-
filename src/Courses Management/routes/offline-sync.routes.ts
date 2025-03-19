import { Router } from 'express';
import { offlineSyncController } from '../controllers/offline-sync.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Sync routes
router.post('/user', offlineSyncController.syncUserActivities);
router.post('/batch', offlineSyncController.batchSyncActivities);

// Content version routes
router.get('/updates', offlineSyncController.checkContentUpdates);
router.post('/version/:contentType/:contentId', offlineSyncController.createContentVersion);

export default router;