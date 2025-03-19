import axios from 'axios';
import logger from '../../utils/logger';
import OERResource from '../models/oer-resource.model';
import { curriculumMappingService } from './curriculum-mapping.service';
import UnifiedCourse from '../models/unified-course.model';


class OERIntegrationService {
  /**
   * Fetch resources from Khan Academy API
   */
  async fetchKhanAcademyResources(subject: string): Promise<any[]> {
    try {
      // Note: Khan Academy API is simulated here. In production, use actual API endpoint
      const response = await axios.get(`${process.env.KHAN_ACADEMY_API_URL}/api/v1/topics/${subject}`);
      
      return response.data.map((resource: any) => ({
        title: resource.title,
        description: resource.description,
        provider: 'Khan Academy',
        url: resource.url,
        type: this.determineContentType(resource),
        language: 'en', // Khan Academy primarily offers English content
        license: 'CC BY-NC-SA 3.0',
        subjects: [subject],
        metadata: {
          duration: resource.duration,
          author: 'Khan Academy'
        }
      }));
    } catch (error: any) {
      logger.error(`Error fetching Khan Academy resources: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape MIT OpenCourseWare for resources
   */
  async fetchMITOpenCourseWare(subject: string): Promise<any[]> {
    try {
      // Note: In production, use a proper scraper or the MIT OCW API if available
      const response = await axios.get(`${process.env.MIT_OCW_URL}/search?q=${subject}`);
      
      // Process the scraped data
      // This is simplified and would require actual HTML parsing in production
      const resources = response.data.results.map((resource: any) => ({
        title: resource.title,
        description: resource.description,
        provider: 'MIT OpenCourseWare',
        url: resource.url,
        type: 'text', // Most MIT OCW resources are text/PDF
        language: 'en',
        license: 'CC BY-NC-SA 4.0',
        subjects: [subject],
        metadata: {
          author: resource.instructor
        }
      }));
      
      return resources;
    } catch (error: any) {
      logger.error(`Error fetching MIT OCW resources: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch OpenStax textbooks
   */
  async fetchOpenStax(subject: string): Promise<any[]> {
    try {
      // Note: In production, use the actual OpenStax API
      const response = await axios.get(`${process.env.OPENSTAX_API_URL}/books?subject=${subject}`);
      
      return response.data.map((book: any) => ({
        title: book.title,
        description: book.description,
        provider: 'OpenStax',
        url: book.pdf_url,
        type: 'text',
        language: 'en',
        license: 'CC BY 4.0',
        subjects: [subject],
        metadata: {
          author: 'OpenStax',
          file_size: book.file_size
        }
      }));
    } catch (error: any) {
      logger.error(`Error fetching OpenStax resources: ${error.message}`);
      return [];
    }
  }

  /**
   * Determine content type based on resource properties
   */
  private determineContentType(resource: any): 'video' | 'text' | 'quiz' | 'audio' {
    if (resource.youtube_id || resource.video_id || resource.url?.includes('youtube') || resource.url?.includes('video')) {
      return 'video';
    } else if (resource.exercise_id || resource.url?.includes('exercise') || resource.url?.includes('quiz')) {
      return 'quiz';
    } else if (resource.audio_id || resource.url?.includes('audio')) {
      return 'audio';
    } else {
      return 'text';
    }
  }

  /**
   * Tag OER resources with Nigerian curriculum codes
   */
  async tagResourcesWithCurriculum(resources: any[], curriculum: 'NERDC' | 'WAEC' | 'NECO'): Promise<any[]> {
    return resources.map(resource => {
      let curriculumCode = null;
      
      // Try to map to curriculum based on title and description
      for (const subject of resource.subjects) {
        switch (curriculum) {
          case 'NERDC':
            curriculumCode = curriculumMappingService.mapToNERDC(
              resource.title,
              resource.description,
              subject
            );
            break;
          case 'WAEC':
            curriculumCode = curriculumMappingService.mapToWAEC(
              resource.title,
              resource.description,
              subject
            );
            break;
          case 'NECO':
            curriculumCode = curriculumMappingService.mapToNECO(
              resource.title,
              resource.description,
              subject
            );
            break;
        }
        
        if (curriculumCode) break;
      }
      
      if (curriculumCode) {
        resource.NERDC_topic_code = curriculumCode;
        resource.curriculum_tags = [curriculum];
      }
      
      return resource;
    });
  }

  /**
   * Integration flow to fetch, tag and save OER resources
   */
  async integrateOERResources(subject: string, curriculum: 'NERDC' | 'WAEC' | 'NECO'): Promise<any> {
    try {
      // Fetch resources from all sources
      const [khanResources, mitResources, openStaxResources] = await Promise.all([
        this.fetchKhanAcademyResources(subject),
        this.fetchMITOpenCourseWare(subject),
        this.fetchOpenStax(subject)
      ]);
      
      // Tag resources with curriculum codes
      const taggedKhanResources = await this.tagResourcesWithCurriculum(khanResources, curriculum);
      const taggedMitResources = await this.tagResourcesWithCurriculum(mitResources, curriculum);
      const taggedOpenStaxResources = await this.tagResourcesWithCurriculum(openStaxResources, curriculum);
      
      // Combine all resources
      const allResources = [...taggedKhanResources, ...taggedMitResources, ...taggedOpenStaxResources];
      
      // Save to database (avoiding duplicates)
      const savedCount = {
        added: 0,
        skipped: 0
      };
      
      for (const resource of allResources) {
        // Check if resource with same URL already exists
        const existing = await OERResource.findOne({ url: resource.url });
        
        if (!existing) {
          await OERResource.create(resource);
          savedCount.added++;
        } else {
          savedCount.skipped++;
        }
      }
      
      return {
        success: true,
        message: `OER integration completed for ${subject}`,
        stats: {
          total: allResources.length,
          khan_academy: taggedKhanResources.length,
          mit_ocw: taggedMitResources.length,
          openstax: taggedOpenStaxResources.length,
          ...savedCount
        }
      };
    } catch (error: any) {
      logger.error(`OER integration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Filter OERs by keyword alignment to specific curriculum
   */
  async filterResourcesByCurriculum(subject: string, curriculumKeywords: string[]): Promise<any[]> {
    try {
      // Find resources matching the subject
      const resources = await OERResource.find({ subjects: { $in: [subject] } });
      
      // Filter resources that match curriculum keywords
      return resources.filter(resource => {
        const content = `${resource.title} ${resource.description}`.toLowerCase();
        return curriculumKeywords.some(keyword => content.includes(keyword.toLowerCase()));
      });
    } catch (error: any) {
      logger.error(`Error filtering resources by curriculum: ${error.message}`);
      return [];
    }
  }

  /**
   * Add OER resources to a course
   */
  async addOERResourcesToUnifiedCourse(courseId: string, subject: string, maxResources: number = 5): Promise<any> {
    try {
      // Find relevant OER resources
      const resources = await OERResource.find({ subjects: { $in: [subject] } })
        .sort({ download_count: -1 })
        .limit(maxResources);
      
      // Format resources for course embedding
      const oerResources = resources.map(resource => ({
        provider: resource.provider,
        url: resource.url,
        type: resource.type,
        license: resource.license
      }));
      
      // Add resources to course
      const course = await UnifiedCourse.findByIdAndUpdate(
        courseId,
        { $set: { oer_resources: oerResources } },
        { new: true }
      );
      
      return course;
    } catch (error: any) {
      logger.error(`Error adding OER resources to course: ${error.message}`);
      throw error;
    }
  }
}

export const oerIntegrationService = new OERIntegrationService();