import OfflineActivity from '../models/offline-activity.model';
import ContentVersion from '../models/content-version.model';
import UnifiedCourse from '../models/unified-course.model';
import OERResource from '../models/oer-resource.model';
import logger from '../../utils/logger';
import { LearningOutcome, ContentEngagement } from '../models/analytics.model';
import { createHash } from 'crypto';
import mongoose from 'mongoose';

class OfflineSyncService {
  
  async syncUserActivities(userId: string): Promise<{
    synced: number;
    failed: number;
  }> {
    try {
      // Get all pending offline activities
      const pendingActivities = await OfflineActivity.find({
        user_id: userId,
        sync_status: 'pending'
      });

      logger.info(`Found ${pendingActivities.length} pending activities for user ${userId}`);

      let syncedCount = 0;
      let failedCount = 0;

      for (const activity of pendingActivities) {
        try {
          // Process based on activity type
          switch (activity.activity_type) {
            case 'quiz_attempt':
              await this.processQuizAttempt(activity);
              break;
            case 'content_view':
              await this.processContentView(activity);
              break;
            case 'download':
              await this.processDownload(activity);
              break;
          }

          // Mark as synced
          activity.sync_status = 'synced';
          activity.synced_at = new Date();
          await activity.save();

          syncedCount++;
        } catch (error: any) {
          // Mark as failed
          activity.sync_status = 'failed';
          await activity.save();

          logger.error(`Failed to sync activity ${activity._id}: ${error.message}`);
          failedCount++;
        }
      }

      return { synced: syncedCount, failed: failedCount };
    } catch (error: any) {
      logger.error(`Error syncing user activities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process quiz attempt activity
   */
  private async processQuizAttempt(activity: any): Promise<void> {
    // Calculate score based on answers
    if (!activity.details.quiz_answers || activity.details.quiz_answers.length === 0) {
      throw new Error('No quiz answers provided');
    }

    // In a real application, we'd validate answers against correct answers
    // For now, let's assume a basic scoring mechanism
    const totalQuestions = activity.details.quiz_answers.length;
    const correctAnswers = Math.floor(totalQuestions * 0.7); // Simulating 70% correct
    const score = correctAnswers;
    const percentage = (score / totalQuestions) * 100;

    // Create a learning outcome record
    const contentModel = await this.getContentModelByType(activity.content_type);
    const content = await contentModel.findById(activity.content_id);
    
    if (!content) {
      throw new Error(`Content not found: ${activity.content_id}`);
    }

    // Create learning outcome record
    await LearningOutcome.create({
      user_id: activity.user_id,
      course_id: activity.content_id,
      activity_date: activity.created_at,
      activity_type: 'quiz',
      score,
      max_score: totalQuestions,
      percentage,
      NERDC_competency_code: content.NERDC_topic_code || undefined,
      curriculum_tag: content.curriculum_tags?.[0] || undefined,
      topic: content.title || 'Unknown',
      competency_level: this.determineCompetencyLevel(percentage)
    });

    // Update content engagement
    await this.updateContentEngagement(activity.content_id, activity.content_type, {
      completions: 1
    });
  }

  /**
   * Process content view activity
   */
  private async processContentView(activity: any): Promise<void> {
    // Update content engagement
    await this.updateContentEngagement(activity.content_id, activity.content_type, {
      views: 1
    });
  }

  /**
   * Process download activity
   */
  private async processDownload(activity: any): Promise<void> {
    // Update download count in the content
    const contentModel = await this.getContentModelByType(activity.content_type);
    
    await contentModel.findByIdAndUpdate(activity.content_id, {
      $inc: { download_count: 1 }
    });

    // Update content engagement
    await this.updateContentEngagement(activity.content_id, activity.content_type, {
      downloads: 1
    });
  }

  /**
   * Update content engagement analytics
   */
  private async updateContentEngagement(
    contentId: mongoose.Types.ObjectId,
    contentType: 'course' | 'oer_resource',
    updates: { views?: number; downloads?: number; completions?: number }
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create engagement record for today
    let engagement = await ContentEngagement.findOne({
      content_id: contentId,
      content_type: contentType,
      date: today
    });

    if (!engagement) {
      engagement = new ContentEngagement({
        content_id: contentId,
        content_type: contentType,
        date: today,
        views: 0,
        downloads: 0,
        completions: 0,
        avg_rating: 0,
        rating_count: 0
      });
    }

    // Update metrics
    if (updates.views) engagement.views += updates.views;
    if (updates.downloads) engagement.downloads += updates.downloads;
    if (updates.completions) engagement.completions += updates.completions;

    await engagement.save();
  }

  /**
   * Get content model by type
   */
  private getContentModelByType(type: string): any {
    if (type === 'course') {
      return UnifiedCourse;
    } else if (type === 'oer_resource') {
      return OERResource;
    } else {
      throw new Error(`Invalid content type: ${type}`);
    }
  }

  /**
   * Determine competency level based on percentage score
   */
  private determineCompetencyLevel(percentage: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (percentage < 50) return 'beginner';
    if (percentage < 70) return 'intermediate';
    if (percentage < 90) return 'advanced';
    return 'expert';
  }

  /**
   * Check if content needs to be updated on client
   */
  async checkContentUpdates(contentId: string, contentType: 'course' | 'oer_resource', versionHash?: string): Promise<{
    needsUpdate: boolean;
    latestVersion?: string;
  }> {
    try {
      // Get the latest version
      const latestVersion = await ContentVersion.findOne({
        content_id: contentId,
        content_type: contentType
      }).sort({ version_number: -1 });

      if (!latestVersion) {
        return { needsUpdate: false };
      }

      // If no version hash provided, it means client has no version
      if (!versionHash) {
        return { needsUpdate: true, latestVersion: latestVersion.version_hash };
      }

      // Check if client version matches latest version
      return {
        needsUpdate: versionHash !== latestVersion.version_hash,
        latestVersion: latestVersion.version_hash
      };
    } catch (error: any) {
      logger.error(`Error checking content updates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new version for content
   */
  async createContentVersion(contentId: string, contentType: 'course' | 'oer_resource', changes: string[], userId?: string): Promise<any> {
    try {
      // Find the latest version
      const latestVersion = await ContentVersion.findOne({
        content_id: contentId,
        content_type: contentType
      }).sort({ version_number: -1 });

      const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;
      
      // Create a hash of the content
      const content = await this.getContentModelByType(contentType).findById(contentId);
      const contentJson = JSON.stringify(content);
      const hash = createHash('md5').update(contentJson).digest('hex');

      // Create a new version
      const newVersion = await ContentVersion.create({
        content_id: contentId,
        content_type: contentType,
        version_hash: hash,
        version_number: versionNumber,
        changes,
        created_by: userId
      });

      return newVersion;
    } catch (error: any) {
      logger.error(`Error creating content version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch sync multiple offline activities
   */
  async batchSyncActivities(activities: any[]): Promise<{
    synced: number;
    failed: number;
  }> {
    try {
      let syncedCount = 0;
      let failedCount = 0;

      // Create offline activities
      const offlineActivities = await OfflineActivity.insertMany(activities);

      // Process each activity
      for (const activity of offlineActivities) {
        try {
          // Process based on activity type
          switch (activity.activity_type) {
            case 'quiz_attempt':
              await this.processQuizAttempt(activity);
              break;
            case 'content_view':
              await this.processContentView(activity);
              break;
            case 'download':
              await this.processDownload(activity);
              break;
          }

          // Mark as synced
          activity.sync_status = 'synced';
          activity.synced_at = new Date();
          await activity.save();

          syncedCount++;
        } catch (error: any) {
          // Mark as failed
          activity.sync_status = 'failed';
          await activity.save();

          logger.error(`Failed to sync activity ${activity._id}: ${error.message}`);
          failedCount++;
        }
      }

      return { synced: syncedCount, failed: failedCount };
    } catch (error: any) {
      logger.error(`Error batch syncing activities: ${error.message}`);
      throw error;
    }
  }
}

export const offlineSyncService = new OfflineSyncService();