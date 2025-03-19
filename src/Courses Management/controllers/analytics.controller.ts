import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import asyncHandler from '../../utils/asyncHandler';
import { analyticsService } from '../services/analytics.service';
import { BadRequestError } from '../../utils/customErrors';

class AnalyticsController {
  /**
   * Track user attendance (login)
   */
  trackAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const userId = req.user._id.toString();
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    const deviceInfo = req.headers['user-agent'];
    
    const attendanceRecord = await analyticsService.trackAttendance(
      userId,
      ipAddress,
      deviceInfo
    );
    
    res.json({
      success: true,
      message: 'Attendance tracked successfully',
      data: attendanceRecord
    });
  });

  /**
   * Record user logout
   */
  recordLogout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const userId = req.user._id.toString();
    const attendanceRecord = await analyticsService.recordLogout(userId);
    
    res.json({
      success: true,
      message: 'Logout recorded successfully',
      data: attendanceRecord
    });
  });

  /**
   * Record learning outcome
   */
  recordLearningOutcome = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const { 
      courseId, 
      activityType, 
      score, 
      maxScore, 
      topic, 
      curriculumTag, 
      nerdcCode 
    } = req.body;
    
    if (!courseId || !activityType || score === undefined || maxScore === undefined) {
      throw new BadRequestError('Required fields missing');
    }
    
    if (!['quiz', 'assignment', 'project', 'exam'].includes(activityType)) {
      throw new BadRequestError('Invalid activity type');
    }
    
    const userId = req.user._id.toString();
    const outcome = await analyticsService.recordLearningOutcome({
      userId,
      courseId,
      activityType,
      score,
      maxScore,
      topic,
      curriculumTag,
      nerdcCode
    });
    
    res.json({
      success: true,
      message: 'Learning outcome recorded successfully',
      data: outcome
    });
  });

  /**
   * Track content engagement
   */
  trackEngagement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contentId, contentType, action, rating } = req.body;
    
    if (!contentId || !contentType || !action) {
      throw new BadRequestError('Required fields missing');
    }
    
    if (contentType !== 'course' && contentType !== 'oer_resource') {
      throw new BadRequestError('Invalid content type');
    }
    
    if (!['view', 'download', 'complete'].includes(action)) {
      throw new BadRequestError('Invalid action');
    }
    
    await analyticsService.trackContentEngagement(
      contentId,
      contentType,
      action,
      rating
    );
    
    res.json({
      success: true,
      message: 'Content engagement tracked successfully'
    });
  });

  /**
   * Get user learning analytics
   */
  getUserAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new BadRequestError('User not authenticated');
    }
    
    const userId = req.params.userId || req.user._id.toString();
    
    // Only admins or the user themselves can access their analytics
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new BadRequestError('You are not authorized to access this user\'s analytics');
    }
    
    const analytics = await analyticsService.getUserLearningAnalytics(userId);
    
    res.json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get content engagement analytics
   */
  getContentAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contentId, contentType } = req.params;
    
    if (!contentId || !contentType) {
      throw new BadRequestError('Content ID and type are required');
    }
    
    if (contentType !== 'course' && contentType !== 'oer_resource') {
      throw new BadRequestError('Invalid content type');
    }
    
    const analytics = await analyticsService.getContentEngagementAnalytics(
      contentId,
      contentType as 'course' | 'oer_resource'
    );
    
    res.json({
      success: true,
      data: analytics
    });
  });

  /**
   * Get system-wide analytics (admin only)
   */
  getSystemAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== 'admin') {
      throw new BadRequestError('Admin access required');
    }
    
    const analytics = await analyticsService.getSystemAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  });
}

export const analyticsController = new AnalyticsController();