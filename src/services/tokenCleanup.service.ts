import { CronJob } from 'cron';
import User from '../models/user.model';
import logger from '../utils/logger';

class TokenCleanupService {
  private cleanupJob: CronJob;

  constructor() {
    // Run cleanup every day at 3 AM
    this.cleanupJob = new CronJob('0 3 * * *', this.cleanup.bind(this));
  }

  start() {
    this.cleanupJob.start();
    logger.info('Token cleanup service started');
  }

  async cleanup() {
    try {
      const result = await User.updateMany(
        {
          $or: [
            { 
              verificationTokenExpires: { 
                $lt: new Date() 
              } 
            },
            { 
              resetPasswordExpires: { 
                $lt: new Date() 
              } 
            }
          ]
        },
        {
          $unset: {
            verificationToken: '',
            verificationTokenExpires: '',
            resetPasswordToken: '',
            resetPasswordExpires: ''
          }
        }
      );

      logger.info(`Cleaned up ${result.modifiedCount} expired tokens`);
    } catch (error) {
      logger.error('Token cleanup failed:', error);
    }
  }

  // Manual cleanup method for testing or immediate cleanup
  async manualCleanup() {
    await this.cleanup();
  }
}

export const tokenCleanupService = new TokenCleanupService();