import { Router } from 'express';
import { oerResourceController } from '../controllers/oer-resource.controller';
import { authenticateToken, authorize} from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, oerResourceController.getResources);
router.get('/:id', authenticateToken, oerResourceController.getResourceById);
router.post('/create', authenticateToken, authorize('teacher', 'admin'), oerResourceController.createResource);

export default router;