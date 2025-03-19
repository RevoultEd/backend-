import { Router } from 'express';
import { validateRequests } from '../middleware/validateRequests';
import { authenticateToken, rateLimiter } from '../middleware/auth.middleware';
import { authController } from '../controllers/auth.controller';
import { 
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  emailSchema 
} from '../validators/auth.validator';

const router = Router();

const strictLimit = rateLimiter(5, 15 * 60 * 1000);
const standardLimit = rateLimiter(20, 15 * 60 * 1000);

// Public routes
// change regsiter route standard limit to strict limit before production
router.post('/register', standardLimit, validateRequests(registerSchema), authController.register);
router.post('/login', strictLimit, validateRequests(loginSchema), authController.login);
router.post('/google', strictLimit, authController.googleAuth);

// Email verification routes
router.get('/verify-email/:token', standardLimit, authController.verifyEmail);
// change resend-verification route standard limit to strict limit before production
router.post('/resend-verification', strictLimit, validateRequests(emailSchema), authController.resendVerification);

// Password reset routes
router.post('/forgot-password', strictLimit, validateRequests(emailSchema), authController.forgotPassword);
router.post('/reset-password/:token', strictLimit, validateRequests(resetPasswordSchema), authController.resetPassword);

// Token management
router.post('/refresh-token', standardLimit, authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);

export default router;