import { moodleService } from './moodle.service';
import { openEdxService } from './openedx.service';
import logger from '../../utils/logger';
import User from '../../models/user.model';

// Define proper interfaces for the LMS results
interface MoodleResult {
  id?: number;
  error?: string;
}

interface OpenEdxResult {
  id?: string;
  error?: string;
}

interface SyncResults {
  moodle: MoodleResult | null;
  openedx: OpenEdxResult | null;
}

class LmsSyncService {
  /**
   * Synchronize a user with both LMS platforms
   */
  async syncUser(userId: string): Promise<SyncResults> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const results: SyncResults = {
        moodle: null,
        openedx: null,
      };

      // Create user in Moodle
      try {
        const names = user.name.split(' ');
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';

        const moodleUser = await moodleService.createUser({
          username: user.email.split('@')[0],
          password: `ChangeMeLater!${  Math.random().toString(36).substring(2, 10)}`,
          firstname: firstName,
          lastname: lastName,
          email: user.email,
        });
        
        results.moodle = moodleUser;
        logger.info(`User ${user.email} successfully created in Moodle`);
      } catch (error: any) {
        logger.error(`Failed to create user in Moodle: ${error.message}`);
        results.moodle = { error: error.message };
      }

      // Create user in Open edX
      try {
        const openEdxUser = await openEdxService.createUser({
          username: user.email.split('@')[0],
          email: user.email,
          name: user.name,
          password: `ChangeMeLater!${  Math.random().toString(36).substring(2, 10)}`,
        });
        
        results.openedx = openEdxUser;
        logger.info(`User ${user.email} successfully created in Open edX`);
      } catch (error: any) {
        logger.error(`Failed to create user in Open edX: ${error.message}`);
        results.openedx = { error: error.message };
      }

      // Update user with LMS IDs if available
      if (results.moodle && !results.moodle.error && results.moodle.id) {
        user.moodleId = results.moodle.id;
      }
      
      if (results.openedx && !results.openedx.error && results.openedx.id) {
        user.openEdxId = results.openedx.id;
      }
      
      await user.save();

      return results;
    } catch (error: any) {
      logger.error(`User synchronization failed: ${error.message}`);
      throw error;
    }
  }
}

export const lmsSyncService = new LmsSyncService();