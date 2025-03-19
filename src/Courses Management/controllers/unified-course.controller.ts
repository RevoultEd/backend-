import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import UnifiedCourse from '../models/unified-course.model';
import User from '../../models/user.model';
import asyncHandler from '../../utils/asyncHandler';
import { NotFoundError } from '../../utils/customErrors';

class UnifiedCourseController {
  /**
   * Get courses with filtering and pagination
   */
  getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { 
      language, 
      type, 
      subjects, 
      curriculum_tags, 
      source,
      page = 1, 
      limit = 10,
      sort = 'download_count',
      order = 'desc'
    } = req.query;
    
    const filter: any = { approved: true };
    
    if (language) filter.language = language;
    if (type) filter.type = type;
    if (source) filter.source = source;
    if (subjects) filter.subjects = { $in: Array.isArray(subjects) ? subjects : [subjects] };
    if (curriculum_tags) filter.curriculum_tags = { $in: Array.isArray(curriculum_tags) ? curriculum_tags : [curriculum_tags] };
    
    const sortOptions: any = {};
    sortOptions[sort as string] = order === 'desc' ? -1 : 1;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    const totalCount = await UnifiedCourse.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limitNum);
    
    const courses = await UnifiedCourse.find(filter)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    res.json({
      success: true,
      data: courses,
      metadata: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: totalPages
      }
    });
  });

  /**
   * Get a single course by ID
   */
  getCourseById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const course = await UnifiedCourse.findById(id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    
    // Increment download count
    course.download_count += 1;
    await course.save();
    
    // Add to user's download history if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          download_history: {
            content_id: course._id,
            downloaded_at: new Date()
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  });

  /**
   * Get course stats
   */
  getCourseStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await UnifiedCourse.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          secondaryCourses: { $sum: { $cond: [{ $eq: ['$type', 'secondary'] }, 1, 0] } },
          universityCourses: { $sum: { $cond: [{ $eq: ['$type', 'university'] }, 1, 0] } },
          moodleCourses: { $sum: { $cond: [{ $eq: ['$source', 'moodle'] }, 1, 0] } },
          openEdxCourses: { $sum: { $cond: [{ $eq: ['$source', 'openedx'] }, 1, 0] } },
          totalDownloads: { $sum: '$download_count' }
        }
      }
    ]);
    
    // Get language distribution
    const languageDistribution = await UnifiedCourse.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get subject distribution
    const subjectDistribution = await UnifiedCourse.aggregate([
      { $unwind: '$subjects' },
      {
        $group: {
          _id: '$subjects',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || {},
        languages: languageDistribution,
        subjects: subjectDistribution
      }
    });
  });
}

export const unifiedCourseController = new UnifiedCourseController();