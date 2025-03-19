import Badge from '../models/badge.model';
import User from '../../models/user.model';
import Content from '../models/content.model';
import logger from '../../utils/logger';
import mongoose from 'mongoose';

class BadgeService {
  // Check and award badges based on contribution count
  async checkContributionBadges(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('contributions badges');
      if (!user) return;
      
      const contributionCount = user.contributions.length;
      
      // Get all contribution badges that the user doesn't have yet
      const contributionBadges = await Badge.find({
        criteria_type: 'contribution_count',
        criteria_value: { $lte: contributionCount }
      });
      
      const userBadgeIds = user.badges.map(badge => badge.badge_id.toString());
      
      for (const badge of contributionBadges) {
        if (!userBadgeIds.includes(badge._id.toString())) {
          // Award the badge
          user.badges.push({
            badge_id: badge._id as mongoose.Types.ObjectId,
            awarded_at: new Date()
          });
          
          logger.info(`Badge "${badge.name}" awarded to user ${userId} for ${contributionCount} contributions`);
        }
      }
      
      await user.save();
    } catch (error) {
      logger.error('Error checking contribution badges:', error);
    }
  }
  
  // Check and award badges based on content downloads
  async checkDownloadBadges(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId).populate('contributions');
      if (!user) return;
      
      // Calculate total downloads across all user contributions
      const contents = await Content.find({ creator: userId });
      const totalDownloads = contents.reduce((sum, content) => sum + content.downloads, 0);
      
      // Get all download badges that the user doesn't have yet
      const downloadBadges = await Badge.find({
        criteria_type: 'download_count',
        criteria_value: { $lte: totalDownloads }
      });
      
      const userBadgeIds = user.badges.map(badge => badge.badge_id.toString());
      
      for (const badge of downloadBadges) {
        if (!userBadgeIds.includes(badge._id.toString())) {
          // Award the badge
          user.badges.push({
            badge_id: badge._id as mongoose.Types.ObjectId,
            awarded_at: new Date()
          });
          
          logger.info(`Badge "${badge.name}" awarded to user ${userId} for ${totalDownloads} downloads`);
        }
      }
      
      await user.save();
    } catch (error) {
      logger.error('Error checking download badges:', error);
    }
  }
  
  // Check and award badges based on upvotes received
  async checkUpvoteBadges(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      // Calculate total upvotes across all user contributions
      const contents = await Content.find({ creator: userId });
      const totalUpvotes = contents.reduce((sum, content) => sum + content.votes.upvotes, 0);
      
      // Get all upvote badges that the user doesn't have yet
      const upvoteBadges = await Badge.find({
        criteria_type: 'upvote_count',
        criteria_value: { $lte: totalUpvotes }
      });
      
      const userBadgeIds = user.badges.map(badge => badge.badge_id.toString());
      
      for (const badge of upvoteBadges) {
        if (!userBadgeIds.includes(badge._id.toString())) {
          // Award the badge
          user.badges.push({
            badge_id: badge._id as mongoose.Types.ObjectId,
            awarded_at: new Date()
          });
          
          logger.info(`Badge "${badge.name}" awarded to user ${userId} for ${totalUpvotes} upvotes`);
        }
      }
      
      await user.save();
    } catch (error) {
      logger.error('Error checking upvote badges:', error);
    }
  }
  
  // Award a badge manually (for admin use)
  async awardBadgeManually(userId: string, badgeId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      const badge = await Badge.findById(badgeId);
      
      if (!user || !badge) return false;
      
      const alreadyHasBadge = user.badges.some(
        userBadge => userBadge.badge_id.toString() === badgeId
      );
      
      if (!alreadyHasBadge) {
        user.badges.push({
          badge_id: badge._id as mongoose.Types.ObjectId,
          awarded_at: new Date()
        });
        
        await user.save();
        logger.info(`Badge "${badge.name}" manually awarded to user ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error awarding badge manually:', error);
      return false;
    }
  }
}

export const badgeService = new BadgeService();