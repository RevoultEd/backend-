import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import asyncHandler from '../../utils/asyncHandler';
import { offlineSyncService } from '../services/offline-sync.service';
import { BadRequestError } from '../../utils/customErrors';

class OfflineSyncController {
  /**
   * Synchronize pending offline activities for a user
   */
  syncUserActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const userId = req.user._id;
    const result = await offlineSyncService.syncUserActivities(userId.toString());
    
    res.json({
      success: true,
      message: `Sync completed: ${result.synced} activities synced, ${result.failed} failed`,
      data: result
    });
  });

  /**
   * Check if content needs to be updated
   */
  checkContentUpdates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contentId, contentType, versionHash } = req.query;
    
    if (!contentId || !contentType) {
      throw new BadRequestError('Content ID and type are required');
    }
    
    if (contentType !== 'course' && contentType !== 'oer_resource') {
      throw new BadRequestError('Content type must be course or oer_resource');
    }
    
    const result = await offlineSyncService.checkContentUpdates(
      contentId as string,
      contentType as 'course' | 'oer_resource',
      versionHash as string
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  /**
   * Create a new version for content
   */
  createContentVersion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contentId, contentType } = req.params;
    const { changes } = req.body;
    
    if (!changes || !Array.isArray(changes)) {
      throw new BadRequestError('Changes array is required');
    }
    
    if (contentType !== 'course' && contentType !== 'oer_resource') {
      throw new BadRequestError('Content type must be course or oer_resource');
    }
    
    const userId = req.user?._id;
    const result = await offlineSyncService.createContentVersion(
      contentId,
      contentType as 'course' | 'oer_resource',
      changes,
      userId?.toString()
    );
    
    res.json({
      success: true,
      message: 'Content version created',
      data: result
    });
  });

  /**
   * Batch sync multiple offline activities
   */
  batchSyncActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { activities } = req.body;
    
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      throw new BadRequestError('Activities array is required');
    }
    
    // Validate user ownership of activities
    if (req.user) {
      for (const activity of activities) {
        if (!activity.user_id || activity.user_id.toString() !== req.user._id.toString()) {
          activity.user_id = req.user._id;
        }
      }
    } else {
      throw new BadRequestError('User not authenticated');
    }
    
    const result = await offlineSyncService.batchSyncActivities(activities);
    
    res.json({
      success: true,
      message: `Batch sync completed: ${result.synced} activities synced, ${result.failed} failed`,
      data: result
    });
  });
}

export const offlineSyncController = new OfflineSyncController();