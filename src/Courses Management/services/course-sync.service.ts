import { moodleService } from './moodle.service';
import { openEdxService } from './openedx.service';
import UnifiedCourse from '../models/unified-course.model';
import logger from '../../utils/logger';

class CourseSyncService {
  /**
   * Synchronize courses from both LMS platforms
   */
  async syncCourses(): Promise<{ added: number; updated: number; failed: number }> {
    const result = {
      added: 0,
      updated: 0,
      failed: 0
    };

    try {
      // Fetch courses from both platforms
      const [moodleCourses, openEdxCourses] = await Promise.all([
        this.fetchMoodleCourses(),
        this.fetchOpenEdxCourses()
      ]);

      // Process each batch of courses
      await this.processCourses(moodleCourses, result);
      await this.processCourses(openEdxCourses, result);

      logger.info(`Course synchronization completed: ${result.added} added, ${result.updated} updated, ${result.failed} failed`);
      return result;
    } catch (error: any) {
      logger.error(`Course synchronization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch courses from Moodle
   */
  private async fetchMoodleCourses(): Promise<any[]> {
    try {
      return await moodleService.getCourses();
    } catch (error) {
      logger.error('Failed to fetch Moodle courses', error);
      return [];
    }
  }

  /**
   * Fetch courses from Open edX
   */
  private async fetchOpenEdxCourses(): Promise<any[]> {
    try {
      return await openEdxService.getCourses();
    } catch (error) {
      logger.error('Failed to fetch Open edX courses', error);
      return [];
    }
  }

  /**
 * Process courses and update the unified courses collection
 */
  private async processCourses(
    courses: any[],
    result: { added: number; updated: number; failed: number }
  ): Promise<void> {
    for (const course of courses) {
      try {
      // Add subject mapping
        if (!course.subjects || course.subjects.length === 0) {
          course.subjects = this.mapSubjects(course);
        }
      
        // Add curriculum tags
        if (!course.curriculum_tags || course.curriculum_tags.length === 0) {
          course.curriculum_tags = this.mapCurriculumTags(course);
        }
      
        // Determine course type if not set
        if (!course.type) {
          course.type = this.determineCourseType(course);
        }

        // Check if course already exists
        const existingCourse = await UnifiedCourse.findOne({
          source: course.source,
          original_id: course.original_id
        });

        if (existingCourse) {
        // Update existing course
          await UnifiedCourse.findByIdAndUpdate(existingCourse._id, {
            $set: {
              title: course.title,
              short_title: course.short_title,
              description: course.description,
              subjects: course.subjects,
              curriculum_tags: course.curriculum_tags,
              type: course.type,
              category: course.category,
              format: course.format,
              startDate: course.startDate,
              endDate: course.endDate,
              media: course.media,
              updated_at: new Date()
            }
          });
          result.updated++;
        } else {
        // Add new course
          await UnifiedCourse.create({
            ...course,
            language: course.language || 'en', // Default language
            download_count: 0,
            approved: true // Default to approved
          });
          result.added++;
        }
      } catch (error) {
        logger.error(`Failed to process course ${course.title}`, error);
        result.failed++;
      }
    }
  }

  /**
   * Map curriculum tags based on course attributes
   * This method can be expanded to use more sophisticated mapping logic
   */
  mapCurriculumTags(course: any): string[] {
    const tags: string[] = [];
    
    // Simple mapping rules - these would be more sophisticated in production
    if (course.type === 'secondary') {
      if (course.title.toLowerCase().includes('waec')) {
        tags.push('WAEC');
      }
      if (course.title.toLowerCase().includes('neco')) {
        tags.push('NECO');
      }
      // Default to NERDC for secondary courses without specific tags
      if (tags.length === 0) {
        tags.push('NERDC');
      }
    }
    
    return tags;
  }

  /**
 * Map subject areas based on course attributes
 */
  mapSubjects(course: any): string[] {
    const subjects: string[] = [];
    const title = course.title.toLowerCase();
  
    // Basic subject mapping
    if (title.includes('math') || title.includes('calculus') || title.includes('algebra')) {
      subjects.push('Mathematics');
    }
    if (title.includes('physics') || title.includes('mechanics')) {
      subjects.push('Physics');
    }
    if (title.includes('chemistry') || title.includes('organic')) {
      subjects.push('Chemistry');
    }
    if (title.includes('biology') || title.includes('life science')) {
      subjects.push('Biology');
    }
    if (title.includes('english') || title.includes('literature')) {
      subjects.push('English');
    }
    if (title.includes('history') || title.includes('social studies')) {
      subjects.push('History');
    }
    if (title.includes('economics') || title.includes('finance')) {
      subjects.push('Economics');
    }
    if (title.includes('computer') || title.includes('programming')) {
      subjects.push('Computer Science');
    }
  
    return subjects.length > 0 ? subjects : ['General'];
  }

  /**
 * Determine if a course is secondary or university level
 */
  determineCourseType(course: any): 'secondary' | 'university' {
  // If coming from Moodle, we've configured it for secondary
    if (course.source === 'moodle') {
      return 'secondary';
    }
  
    // If coming from Open edX, we've configured it for university
    if (course.source === 'openedx') {
      return 'university';
    }
  
    // Default based on title analysis
    const title = course.title.toLowerCase();
    if (
      title.includes('high school') || 
    title.includes('secondary') || 
    title.includes('waec') || 
    title.includes('neco') ||
    title.includes('nerdc')
    ) {
      return 'secondary';
    }
  
    return 'university';
  }
}

export const courseSyncService = new CourseSyncService();