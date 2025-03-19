import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import asyncHandler from '../../utils/asyncHandler';
import { curriculumMappingService } from '../services/curriculum-mapping.service';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import UnifiedCourse from '../models/unified-course.model';
import OERResource from '../models/oer-resource.model';

class CurriculumController {
  /**
   * Get curriculum topics by subject
   */
  getTopicsBySubject = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { subject, curriculum } = req.query;
    
    if (!subject || !curriculum) {
      throw new BadRequestError('Subject and curriculum are required');
    }
    
    const topics = curriculumMappingService.getTopicsBySubject(
      subject as string,
      curriculum as 'NERDC' | 'WAEC' | 'NECO'
    );
    
    res.json({
      success: true,
      count: topics.length,
      data: topics
    });
  });

  /**
   * Tag a course with curriculum code
   */
  tagCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    const { curriculum_code, curriculum_type } = req.body;
    
    if (!curriculum_code || !curriculum_type) {
      throw new BadRequestError('Curriculum code and type are required');
    }
    
    const course = await UnifiedCourse.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    
    // Add curriculum code
    course.NERDC_topic_code = curriculum_code;
    
    // Add to curriculum tags if not present
    if (!course.curriculum_tags?.includes(curriculum_type)) {
      course.curriculum_tags = [...(course.curriculum_tags || []), curriculum_type];
    }
    
    await course.save();
    
    res.json({
      success: true,
      message: `Course successfully tagged with ${curriculum_type} code: ${curriculum_code}`,
      data: course
    });
  });

  /**
   * Find courses by curriculum tag and topic code
   */
  findCoursesByCurriculum = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { curriculum_type, topic_code, subject, language } = req.query;
    
    const filter: any = {};
    
    if (curriculum_type) {
      filter.curriculum_tags = curriculum_type;
    }
    
    if (topic_code) {
      filter.NERDC_topic_code = topic_code;
    }
    
    if (subject) {
      filter.subjects = { $in: [subject] };
    }
    
    if (language) {
      filter.language = language;
    }
    
    const courses = await UnifiedCourse.find(filter)
      .sort({ download_count: -1 })
      .limit(50);
    
    // Find related OER resources
    const oerResources = await OERResource.find(filter)
      .sort({ download_count: -1 })
      .limit(20);
    
    res.json({
      success: true,
      count: {
        courses: courses.length,
        resources: oerResources.length
      },
      data: {
        courses,
        resources: oerResources
      }
    });
  });

  /**
   * Get curriculum statistics
   */
  getCurriculumStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get curriculum coverage stats
    const nerdcCoverage = await UnifiedCourse.countDocuments({
      curriculum_tags: 'NERDC',
      NERDC_topic_code: { $exists: true }
    });
    
    const waecCoverage = await UnifiedCourse.countDocuments({
      curriculum_tags: 'WAEC'
    });
    
    const necoCoverage = await UnifiedCourse.countDocuments({
      curriculum_tags: 'NECO'
    });
    
    // Get subject distribution with curriculum tags
    const subjectDistribution = await UnifiedCourse.aggregate([
      { $unwind: '$subjects' },
      { $unwind: '$curriculum_tags' },
      {
        $group: {
          _id: {
            subject: '$subjects',
            curriculum: '$curriculum_tags'
          },
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
        curriculum_coverage: {
          NERDC: nerdcCoverage,
          WAEC: waecCoverage,
          NECO: necoCoverage
        },
        subject_distribution: subjectDistribution
      }
    });
  });
}

export const curriculumController = new CurriculumController();