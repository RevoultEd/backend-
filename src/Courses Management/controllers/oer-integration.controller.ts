import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import asyncHandler from '../../utils/asyncHandler';
import { oerIntegrationService } from '../services/oer-integration.service';
import { BadRequestError } from '../../utils/customErrors';

class OERIntegrationController {
  /**
   * Fetch and integrate OER resources for a subject
   */
  integrateOERResources = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { subject, curriculum } = req.body;
    
    if (!subject || !curriculum) {
      throw new BadRequestError('Subject and curriculum are required');
    }
    
    if (!['NERDC', 'WAEC', 'NECO'].includes(curriculum)) {
      throw new BadRequestError('Curriculum must be one of NERDC, WAEC, NECO');
    }
    
    const result = await oerIntegrationService.integrateOERResources(
      subject,
      curriculum as 'NERDC' | 'WAEC' | 'NECO'
    );
    
    res.json({
      success: true,
      message: `OER resources integrated for ${subject} with ${curriculum} curriculum`,
      data: result
    });
  });

  /**
   * Filter OER resources by curriculum keywords
   */
  filterResourcesByCurriculum = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { subject, keywords } = req.body;
    
    if (!subject || !keywords || !Array.isArray(keywords)) {
      throw new BadRequestError('Subject and keywords array are required');
    }
    
    const filteredResources = await oerIntegrationService.filterResourcesByCurriculum(
      subject,
      keywords
    );
    
    res.json({
      success: true,
      count: filteredResources.length,
      data: filteredResources
    });
  });

  /**
   * Add OER resources to a unified course
   */
  addOERResourcesToCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    const { subject, maxResources } = req.body;
    
    if (!subject) {
      throw new BadRequestError('Subject is required');
    }
    
    const course = await oerIntegrationService.addOERResourcesToUnifiedCourse(
      courseId,
      subject,
      maxResources
    );
    
    res.json({
      success: true,
      message: 'OER resources added to course',
      data: course
    });
  });
}

export const oerIntegrationController = new OERIntegrationController();