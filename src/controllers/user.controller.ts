import { Response } from 'express';
import User from '../models/user.model';
import Content from '../Content_Upload/models/content.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

class UserController {
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: user
    });
  });

  updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, preferred_language } = (req as any).validated.body;
  
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
  
    if (name) user.name = name;
    if (preferred_language) user.preferred_language = preferred_language;
  
    await user.save();
  
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferred_language: user.preferred_language
      }
    });
  });

  getUserDownloadHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'download_history.content_id',
        select: 'title subject content_type format'
      });
  
    if (!user) {
      throw new NotFoundError('User not found');
    }
  
    res.json({
      success: true,
      data: user.download_history
    });
  });
  
  getUserContributions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId || req.user._id;
  
    // Check if the requested user exists
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      throw new NotFoundError('User not found');
    }
  
    // If requesting someone else's contributions, only return approved content
    const query: any = { creator: userId };
    if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
      query.approved = true;
    }
  
    const contributions = await Content.find(query)
      .select('title description subject content_type format votes created_at approved');
  
    res.json({
      success: true,
      data: contributions
    });
  });
  
  changeUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Only admins can change roles
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to change user roles');
    }
  
    const { userId, role } = (req as any).validated.body;
      
    if (!['student', 'teacher', 'admin'].includes(role)) {
      throw new BadRequestError('Invalid role specified');
    }
  
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
  
    user.role = role;
    await user.save();
  
    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};
  

export const userController = new UserController();