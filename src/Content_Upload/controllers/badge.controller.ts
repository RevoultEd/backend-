import { Response } from 'express';
import Badge from '../models/badge.model';
import User from '../../models/user.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth.middleware';
import { badgeService } from '../services/badge.service';

class BadgeController {
  // Get all available badges
  getAllBadges = asyncHandler(async (req: AuthRequest, res: Response) => {
    const badges = await Badge.find({});
    
    res.json({
      success: true,
      data: badges
    });
  });
  
  // Get badges for a specific user
  getUserBadges = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.userId || req.user._id;
    
    const user = await User.findById(userId)
      .populate({
        path: 'badges.badge_id',
        select: 'name description icon_url criteria_type criteria_value'
      });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.json({
      success: true,
      data: user.badges
    });
  });
  
  // Create a new badge (admin only)
  createBadge = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can create badges');
    }
    
    const { name, description, icon_url, criteria_type, criteria_value } = (req as any).validated.body;
    
    const badge = await Badge.create({
      name,
      description,
      icon_url,
      criteria_type,
      criteria_value
    });
    
    res.status(201).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    });
  });
  
  // Update a badge (admin only)
  updateBadge = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can update badges');
    }
    
    const badgeId = req.params.id;
    const { name, description, icon_url, criteria_type, criteria_value } = (req as any).validated.body;
    
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }
    
    // Update fields
    if (name) badge.name = name;
    if (description) badge.description = description;
    if (icon_url) badge.icon_url = icon_url;
    if (criteria_type) badge.criteria_type = criteria_type;
    if (criteria_value) badge.criteria_value = criteria_value;
    
    await badge.save();
    
    res.json({
      success: true,
      message: 'Badge updated successfully',
      data: badge
    });
  });
  
  // Delete a badge (admin only)
  deleteBadge = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete badges');
    }
    
    const badgeId = req.params.id;
    
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }
    
    await Badge.findByIdAndDelete(badgeId);
    
    // Remove this badge from all users who have it
    await User.updateMany(
      { 'badges.badge_id': badgeId },
      { $pull: { badges: { badge_id: badgeId } } }
    );
    
    res.json({
      success: true,
      message: 'Badge deleted successfully'
    });
  });
  
  // Award a badge manually (admin only)
  awardBadge = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Only admins can manually award badges');
    }
    
    const { userId, badgeId } = (req as any).validated.body;
    
    const awarded = await badgeService.awardBadgeManually(userId, badgeId);
    
    if (!awarded) {
      throw new BadRequestError('Could not award badge. User may already have this badge or badge/user does not exist.');
    }
    
    res.json({
      success: true,
      message: 'Badge awarded successfully'
    });
  });
  
  // Check all badges for a user
  checkAllBadges = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user._id.toString();
    
    // Check all types of badges
    await badgeService.checkContributionBadges(userId);
    await badgeService.checkDownloadBadges(userId);
    await badgeService.checkUpvoteBadges(userId);
    
    // Get updated user badges
    const user = await User.findById(userId).populate({
      path: 'badges.badge_id',
      select: 'name description icon_url'
    });
    
    res.json({
      success: true,
      message: 'Badges updated successfully',
      data: user?.badges || []
    });
  });
}

export const badgeController = new BadgeController();