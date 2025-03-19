import { Router } from 'express';
import { badgeController } from '../controllers/badge.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';
import { validateRequests } from '../../middleware/validateRequests';
import { 
  createBadgeSchema,
  updateBadgeSchema,
  awardBadgeSchema
} from '../validators/badge.validator';

const router = Router();

router.use(authenticateToken);

// Get all badges
router.get('/', badgeController.getAllBadges);

// Get badges for the current user
router.get('/my-badges', badgeController.getUserBadges);

// Get badges for a specific user
router.get('/user/:userId', badgeController.getUserBadges);

// Check all badges for the current user
router.get('/check', badgeController.checkAllBadges);

// Admin routes
router.post('/', 
  authorize('admin'),
  validateRequests(createBadgeSchema),
  badgeController.createBadge
);

router.put('/:id', 
  authorize('admin'),
  validateRequests(updateBadgeSchema),
  badgeController.updateBadge
);

router.delete('/:id', 
  authorize('admin'),
  badgeController.deleteBadge
);

router.post('/award', 
  authorize('admin'),
  validateRequests(awardBadgeSchema),
  badgeController.awardBadge
);

export default router;