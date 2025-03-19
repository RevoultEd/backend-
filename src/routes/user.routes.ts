import { Router } from 'express';
import { authenticateToken, rateLimiter, authorize } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

const standardLimit = rateLimiter(20, 15 * 60 * 1000);
const strictLimit = rateLimiter(5, 15 * 60 * 1000);

// Get current user
router.get('/me', authenticateToken, standardLimit, userController.getCurrentUser);

// Update user profile
router.put('/profile', authenticateToken, standardLimit, userController.updateUserProfile);

// Get user download history
router.get('/download-history', authenticateToken, standardLimit, userController.getUserDownloadHistory);

// Get user contributions
router.get('/contributions/:userId?', authenticateToken, standardLimit, userController.getUserContributions);

// Change user role (admin only)
router.put('/change-role', authenticateToken, authorize('admin'), strictLimit, userController.changeUserRole);

export default router;