// Create new file: server/src/controllers/language.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { languageService } from '../services/language.service';
import asyncHandler from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/customErrors';

class LanguageController {
  /**
   * Update user's language preference
   */
  setLanguage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { language } = req.body;
    
    if (!languageService.supportedLanguages.includes(language)) {
      throw new BadRequestError(`Unsupported language. Supported languages: ${languageService.supportedLanguages.join(', ')}`);
    }
    
    await languageService.setUserLanguage(req.user._id, language);
    
    res.json({
      success: true,
      message: `Language preference updated to ${language}`,
      data: {
        preferred_language: language
      }
    });
  });
  
  /**
   * Get supported languages
   */
  getSupportedLanguages = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        supported_languages: languageService.supportedLanguages,
        default_language: languageService.defaultLanguage
      }
    });
  });
}

export const languageController = new LanguageController();