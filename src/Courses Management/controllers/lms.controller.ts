// server/src/controllers/lms.controller.ts
import { Response } from 'express';
import { lmsSyncService } from '../services/lms-sync.service';
import { courseSyncService } from '../services/course-sync.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import User from '../../models/user.model';
import UnifiedCourse from '../models/unified-course.model';

class LmsController {
  syncUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await lmsSyncService.syncUser(req.user._id);
    
    res.json({
      success: true,
      message: 'User synchronized with LMS platforms',
      data: result
    });
  });

  /**
   * Synchronize a specific user with LMS platforms (admin only)
   */
  syncSpecificUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const result = await lmsSyncService.syncUser(userId);
    
    res.json({
      success: true,
      message: `User ${user.email} synchronized with LMS platforms`,
      data: result
    });
  });

  syncCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await courseSyncService.syncCourses();
  
    res.json({
      success: true,
      message: 'Courses synchronized with LMS platforms',
      data: result
    });
  });

  getUnifiedCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { language, type, subjects, curriculum_tags } = req.query;
  
    const filter: any = {};
  
    if (language) filter.language = language;
    if (type) filter.type = type;
    if (subjects) filter.subjects = { $in: Array.isArray(subjects) ? subjects : [subjects] };
    if (curriculum_tags) filter.curriculum_tags = { $in: Array.isArray(curriculum_tags) ? curriculum_tags : [curriculum_tags] };
  
    const courses = await UnifiedCourse.find(filter)
      .sort({ download_count: -1 })
      .limit(50);
  
    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  });
}

export const lmsController = new LmsController();