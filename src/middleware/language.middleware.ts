// server/src/middleware/language.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { languageService } from '../Courses Management/services/language.service';
import { AuthRequest } from './auth.middleware';
import logger from '../utils/logger';

// Extend Express Request interface to include language property
declare global {
  namespace Express {
    interface Request {
      language?: string;
    }
  }
}

/**
 * Middleware to set language preference in request
 */
export const setLanguagePreference = async (req: Request, res: Response, next: NextFunction) => {
  // Get language from request headers
  let language = languageService.getLanguageFromRequest(req);
  
  // If authenticated, try to get user's preferred language
  const authReq = req as AuthRequest;
  if (authReq.user && authReq.user._id) {
    try {
      const userLanguage = await languageService.getUserLanguage(authReq.user._id);
      if (userLanguage) {
        language = userLanguage;
      }
    } catch (error) {
      logger.error('Error getting user language:', error);
      // Continue with header-detected language if error
    }
  }
  
  // Add language to request for use in controllers
  req.language = language;
  
  // Set content language header
  res.set('Content-Language', language);
  
  next();
};