import { Router } from 'express';
import { languageController } from '../controllers/language.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

router.get('/supported', languageController.getSupportedLanguages);
router.post('/preference', authenticateToken, languageController.setLanguage);

export default router;