import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import OERResource from '../models/oer-resource.model';
import asyncHandler from '../../utils/asyncHandler';
import User from '../../models/user.model';
import { NotFoundError } from '../../utils/customErrors';

class OERResourceController {
  /**
   * Get OER resources with filtering
   */
  getResources = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, language, subjects, provider } = req.query;
    
    const filter: any = {};
    
    if (type) filter.type = type;
    if (language) filter.language = language;
    if (subjects) filter.subjects = { $in: Array.isArray(subjects) ? subjects : [subjects] };
    if (provider) filter.provider = provider;
    
    const resources = await OERResource.find(filter)
      .sort({ download_count: -1 })
      .limit(50);
    
    res.json({
      success: true,
      count: resources.length,
      data: resources
    });
  });

  /**
   * Get a single OER resource by ID
   */
  getResourceById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const resource = await OERResource.findById(id);
    if (!resource) {
      throw new NotFoundError('OER resource not found');
    }
    
    // Increment download count
    resource.download_count += 1;
    await resource.save();
    
    // Add to user's download history
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          download_history: {
            content_id: resource._id,
            downloaded_at: new Date()
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: resource
    });
  });

  /**
   * Create a new OER resource
   */
  createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, provider, url, type, language, license, subjects, curriculum_tags, NERDC_topic_code, metadata } = req.body;
    
    const resource = await OERResource.create({
      title,
      description,
      provider,
      url,
      type,
      language,
      license,
      subjects,
      curriculum_tags,
      NERDC_topic_code,
      metadata,
      download_count: 0
    });
    
    res.status(201).json({
      success: true,
      message: 'OER resource created successfully',
      data: resource
    });
  });
}

export const oerResourceController = new OERResourceController();