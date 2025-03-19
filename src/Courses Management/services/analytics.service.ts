import { LearningOutcome, AttendanceRecord, ContentEngagement, CurriculumProgress } from '../models/analytics.model';
import User from '../../models/user.model';
import UnifiedCourse from '../models/unified-course.model';
import OERResource from '../models/oer-resource.model';
import logger from '../../utils/logger';
import mongoose from 'mongoose';
import geoip from 'geoip-lite';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';

class AnalyticsService {
  /**
   * Track user login/attendance
   */
  async trackAttendance(userId: string, ipAddress: string, deviceInfo?: string): Promise<any> {
    try {
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get geolocation from IP
      const geo = geoip.lookup(ipAddress);
      
      // Create attendance record
      const attendance = await AttendanceRecord.create({
        user_id: userId,
        login_date: new Date(),
        ip_address: ipAddress,
        device_info: deviceInfo,
        geolocation: geo ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          latitude: geo.ll ? geo.ll[0] : undefined,
          longitude: geo.ll ? geo.ll[1] : undefined
        } : undefined
      });

      // Update user's last login
      user.lastLogin = new Date();
      await user.save();

      return attendance;
    } catch (error: any) {
      logger.error(`Error tracking attendance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record user logout and update session duration
   */
  async recordLogout(userId: string): Promise<any> {
    try {
      // Find the most recent attendance record for this user
      const attendance = await AttendanceRecord.findOne({
        user_id: userId,
        logout_date: { $exists: false }
      }).sort({ login_date: -1 });

      if (!attendance) {
        throw new NotFoundError('No active session found for user');
      }

      // Update logout time and session duration
      const logoutTime = new Date();
      const sessionDuration = (logoutTime.getTime() - attendance.login_date.getTime()) / 1000; // in seconds
      
      attendance.logout_date = logoutTime;
      attendance.session_duration = sessionDuration;
      await attendance.save();

      return attendance;
    } catch (error: any) {
      logger.error(`Error recording logout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Record learning outcome from user activity
   */
  async recordLearningOutcome(data: {
    userId: string;
    courseId: string;
    activityType: 'quiz' | 'assignment' | 'project' | 'exam';
    score: number;
    maxScore: number;
    topic?: string;
    curriculumTag?: string;
    nerdcCode?: string;
  }): Promise<any> {
    try {
      // Validate inputs
      if (!data.userId || !data.courseId) {
        throw new BadRequestError('User ID and Course ID are required');
      }

      // Calculate percentage
      const percentage = (data.score / data.maxScore) * 100;
      
      // Get course info for topic if not provided
      let topic = data.topic;
      let curriculumTag = data.curriculumTag;
      let nerdcCode = data.nerdcCode;
      
      if (!topic || !curriculumTag || !nerdcCode) {
        const course = await UnifiedCourse.findById(data.courseId);
        if (course) {
          topic = topic || course.title;
          curriculumTag = curriculumTag || (course.curriculum_tags && course.curriculum_tags.length > 0 ? course.curriculum_tags[0] : undefined);
          nerdcCode = nerdcCode || course.NERDC_topic_code;
        }
      }

      // Determine competency level
      let competencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      if (percentage < 50) competencyLevel = 'beginner';
      else if (percentage < 70) competencyLevel = 'intermediate';
      else if (percentage < 90) competencyLevel = 'advanced';
      else competencyLevel = 'expert';

      // Create learning outcome record
      const learningOutcome = await LearningOutcome.create({
        user_id: data.userId,
        course_id: data.courseId,
        activity_date: new Date(),
        activity_type: data.activityType,
        score: data.score,
        max_score: data.maxScore,
        percentage,
        topic: topic || 'Unknown',
        curriculum_tag: curriculumTag,
        NERDC_competency_code: nerdcCode,
        competency_level: competencyLevel
      });

      // Update curriculum progress if NERDC code exists
      if (nerdcCode && curriculumTag) {
        await this.updateCurriculumProgress(data.userId, nerdcCode, topic || 'Unknown', curriculumTag, percentage);
      }

      return learningOutcome;
    } catch (error: any) {
      logger.error(`Error recording learning outcome: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update curriculum progress for a user
   */
  private async updateCurriculumProgress(
    userId: string,
    curriculumCode: string,
    topic: string,
    subject: string,
    score: number
  ): Promise<void> {
    try {
      // Find existing progress record
      let progress = await CurriculumProgress.findOne({
        user_id: userId,
        curriculum_code: curriculumCode.split('.')[0], // Get main curriculum code without topic
        subject
      });

      // If no record exists, create one
      if (!progress) {
        // Get total topics for this curriculum
        const totalTopicsCount = 20; // This would be fetched from curriculum service in production
        
        progress = new CurriculumProgress({
          user_id: userId,
          curriculum_code: curriculumCode.split('.')[0],
          subject,
          topics_completed: [],
          topics_total: totalTopicsCount,
          progress_percentage: 0,
          competency_scores: {}
        });
      }

      // Update competency score for this topic
      const competencyScores = progress.competency_scores instanceof Map ? Object.fromEntries(progress.competency_scores) : progress.competency_scores;

      competencyScores[topic] = score;
      progress.competency_scores = competencyScores;

      // Add to completed topics if not already there and score >= 70%
      if (score >= 70 && !progress.topics_completed.includes(topic)) {
        progress.topics_completed.push(topic);
      }

      // Update progress percentage
      progress.progress_percentage = (progress.topics_completed.length / progress.topics_total) * 100;
      progress.last_activity_date = new Date();

      await progress.save();
    } catch (error: any) {
      logger.error(`Error updating curriculum progress: ${error.message}`);
      // Don't throw error to prevent blocking the main flow
    }
  }

  /**
   * Track content engagement
   */
  async trackContentEngagement(
    contentId: string,
    contentType: 'course' | 'oer_resource',
    action: 'view' | 'download' | 'complete',
    rating?: number
  ): Promise<void> {
    try {
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

      // Update metrics based on action
      switch (action) {
        case 'view':
          engagement.views += 1;
          break;
        case 'download':
          engagement.downloads += 1;
          break;
        case 'complete':
          engagement.completions += 1;
          break;
      }

      // Update rating if provided
      if (rating !== undefined && rating >= 1 && rating <= 5) {
        const totalRatingPoints = engagement.avg_rating * engagement.rating_count;
        engagement.rating_count += 1;
        engagement.avg_rating = (totalRatingPoints + rating) / engagement.rating_count;
      }

      await engagement.save();
    } catch (error: any) {
      logger.error(`Error tracking content engagement: ${error.message}`);
      // Don't throw to prevent blocking main flow
    }
  }

  /**
   * Get user learning analytics
   */
  async getUserLearningAnalytics(userId: string): Promise<any> {
    try {
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get recent learning outcomes
      const recentOutcomes = await LearningOutcome.find({ user_id: userId })
        .sort({ activity_date: -1 })
        .limit(10);

      // Calculate average scores by activity type
      const avgScores = await LearningOutcome.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: '$activity_type',
          avgScore: { $avg: '$percentage' },
          count: { $sum: 1 }
        }
        }
      ]);

      // Get progress by curriculum/subject
      const curriculumProgress = await CurriculumProgress.find({ user_id: userId });

      // Get user attendance analytics
      const attendanceRecords = await AttendanceRecord.find({ user_id: userId })
        .sort({ login_date: -1 })
        .limit(30);

      // Calculate total learning time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const totalTimeQuery = await AttendanceRecord.aggregate([
        { 
          $match: { 
            user_id: new mongoose.Types.ObjectId(userId),
            login_date: { $gte: thirtyDaysAgo },
            session_duration: { $exists: true, $ne: null }
          } 
        },
        { 
          $group: {
            _id: null,
            totalTime: { $sum: '$session_duration' },
            sessionsCount: { $sum: 1 }
          } 
        }
      ]);

      const totalLearningTime = totalTimeQuery.length > 0 ? totalTimeQuery[0].totalTime : 0;
      
      const sessionsCount = totalTimeQuery.length > 0 ? totalTimeQuery[0].sessionsCount : 0;

      // Return comprehensive analytics
      return {
        recentActivity: recentOutcomes,
        averageScores: avgScores,
        curriculumProgress,
        attendance: {
          recentSessions: attendanceRecords,
          totalLearningTime, // in seconds
          sessionsCount,
          averageSessionTime: sessionsCount > 0 ? totalLearningTime / sessionsCount : 0
        }
      };
    } catch (error: any) {
      logger.error(`Error getting user learning analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get content engagement analytics
   */
  async getContentEngagementAnalytics(contentId: string, contentType: 'course' | 'oer_resource'): Promise<any> {
    try {
      // Validate content exists
      let content;
      
      if (contentType === 'course') {
        content = await UnifiedCourse.findById(contentId);
      } else {
        content = await OERResource.findById(contentId);
      }
      
      if (!content) {
        throw new NotFoundError('Content not found');
      }

      // Get daily engagement for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dailyEngagement = await ContentEngagement.find({
        content_id: contentId,
        content_type: contentType,
        date: { $gte: thirtyDaysAgo }
      }).sort({ date: 1 });

      // Calculate totals and averages
      const totals = dailyEngagement.reduce((acc, day) => {
        acc.views += day.views;
        acc.downloads += day.downloads;
        acc.completions += day.completions;
        return acc;
      }, { views: 0, downloads: 0, completions: 0 });

      // Calculate completion rate
      const completionRate = totals.views > 0 ? (totals.completions / totals.views) * 100 : 0;

      // Get average rating
      const avgRating = dailyEngagement.length > 0 ? dailyEngagement.reduce((sum, day) => sum + day.avg_rating, 0) / dailyEngagement.length : 0;
      
      const ratingCount = dailyEngagement.reduce((sum, day) => sum + day.rating_count, 0);

      return {
        dailyEngagement,
        totals,
        completionRate,
        rating: {
          average: avgRating,
          count: ratingCount
        }
      };
    } catch (error: any) {
      logger.error(`Error getting content engagement analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get system-wide analytics
   */
  async getSystemAnalytics(): Promise<any> {
    try {
      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeUsersCount = await AttendanceRecord.aggregate([
        {
          $match: {
            login_date: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: '$user_id'
          }
        },
        {
          $count: 'activeUsers'
        }
      ]);

      const activeUsers = activeUsersCount.length > 0 ? activeUsersCount[0].activeUsers : 0;

      // Get total users
      const totalUsers = await User.countDocuments();

      // Get total courses and OER resources
      const totalCourses = await UnifiedCourse.countDocuments();
      const totalOERResources = await mongoose.model('OERResource').countDocuments();

      // Get top performing courses (by completion rate)
      const topCourses = await ContentEngagement.aggregate([
        {
          $group: {
            _id: { content_id: '$content_id', content_type: '$content_type' },
            views: { $sum: '$views' },
            completions: { $sum: '$completions' },
            downloads: { $sum: '$downloads' },
            avg_rating: { $avg: '$avg_rating' }
          }
        },
        {
          $match: {
            views: { $gt: 10 } // Minimum threshold for relevance
          }
        },
        {
          $addFields: {
            completion_rate: { $multiply: [{ $divide: ['$completions', '$views'] }, 100] }
          }
        },
        {
          $sort: { completion_rate: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'Courses',
            localField: '_id.content_id',
            foreignField: '_id',
            as: 'courseDetails'
          }
        },
        {
          $addFields: {
            title: { $arrayElemAt: ['$courseDetails.title', 0] },
            subject: { $arrayElemAt: ['$courseDetails.subjects', 0] }
          }
        },
        {
          $project: {
            _id: 0,
            content_id: '$_id.content_id',
            content_type: '$_id.content_type',
            title: 1,
            subject: 1,
            views: 1,
            completions: 1,
            downloads: 1,
            completion_rate: 1,
            avg_rating: 1
          }
        }
      ]);

      // Get curriculum adoption statistics
      const curriculumStats = await CurriculumProgress.aggregate([
        {
          $group: {
            _id: {
              curriculum: '$curriculum_code',
              subject: '$subject'
            },
            users_count: { $sum: 1 },
            avg_progress: { $avg: '$progress_percentage' }
          }
        },
        {
          $sort: { users_count: -1 }
        }
      ]);

      return {
        userStats: {
          totalUsers,
          activeUsers,
          engagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
        },
        contentStats: {
          totalCourses,
          totalOERResources,
          topCourses
        },
        curriculumAdoption: curriculumStats
      };
    } catch (error: any) {
      logger.error(`Error getting system analytics: ${error.message}`);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();