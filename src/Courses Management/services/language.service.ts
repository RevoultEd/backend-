// Create new file: server/src/services/language.service.ts
import User from '../../models/user.model';
import logger from '../../utils/logger';

class LanguageService {
  // List of supported languages
  supportedLanguages = ['en', 'ha', 'yo', 'ig'];
  defaultLanguage = 'en';
  
  /**
   * Get user's preferred language
   * @param userId User ID to get language preference for
   * @returns Preferred language code
   */
  async getUserLanguage(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId).select('preferred_language');
      return user?.preferred_language || this.defaultLanguage;
    } catch (error) {
      logger.error(`Error getting user language preference: ${error}`);
      return this.defaultLanguage;
    }
  }
  
  /**
   * Update user's language preference
   * @param userId User ID to update
   * @param language Language code to set as preference
   */
  async setUserLanguage(userId: string, language: string): Promise<boolean> {
    // Validate language code
    if (!this.supportedLanguages.includes(language)) {
      return false;
    }
    
    try {
      await User.findByIdAndUpdate(userId, { preferred_language: language });
      return true;
    } catch (error) {
      logger.error(`Error updating user language preference: ${error}`);
      return false;
    }
  }
  
  getLanguageFromRequest(req: any): string {
    const acceptLanguage = req.header('Accept-Language');
    if (acceptLanguage) {
      // Parse the Accept-Language header
      const languages = acceptLanguage.split(',')
        .map((lang: string) => lang.split(';')[0].trim());
      
      // Find the first supported language
      for (const lang of languages) {
        const langCode = lang.substring(0, 2).toLowerCase();
        if (this.supportedLanguages.includes(langCode)) {
          return langCode;
        }
      }
    }
    
    // If no supported language found in headers, use default
    return this.defaultLanguage;
  }
}

export const languageService = new LanguageService();