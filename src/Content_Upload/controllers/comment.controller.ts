import { Response } from 'express';
import Comment from '../models/comment.model';
import Content from '../models/content.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth.middleware';

class CommentController {
  // Add a comment to content
  addComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content_id, text, parent_id } = (req as any).validated.body;
    
    // Check if the content exists and is approved
    const content = await Content.findById(content_id);
    if (!content) {
      throw new NotFoundError('Content not found');
    }
    
    if (!content.approved && 
        req.user.role !== 'admin' && 
        content.creator.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Cannot comment on unapproved content');
    }
    
    // If this is a reply, check if parent comment exists
    if (parent_id) {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment) {
        throw new NotFoundError('Parent comment not found');
      }
      
      // Make sure the parent comment is for the same content
      if (parentComment.content_id.toString() !== content_id) {
        throw new BadRequestError('Parent comment does not belong to this content');
      }
    }
    
    const comment = await Comment.create({
      content_id,
      user: req.user._id,
      text,
      parent_id: parent_id || null
    });
    
    // Populate user data
    await comment.populate('user', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });
  });
  
  // Get comments for content
  getContentComments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const contentId = req.params.contentId;
    const { page = 1, limit = 20, parent_id } = (req as any).validated.query;
    
    // Check if content exists and is accessible
    const content = await Content.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content not found');
    }
    
    if (!content.approved && 
        req.user.role !== 'admin' && 
        content.creator.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Cannot access comments for unapproved content');
    }
    
    // Build query
    const query: any = { 
      content_id: contentId,
      is_deleted: false
    };
    
    // If parent_id is null, get top-level comments
    // If parent_id is provided, get replies to that comment
    if (parent_id === 'null') {
      query.parent_id = null;
    } else if (parent_id) {
      query.parent_id = parent_id;
    }
    
    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: { created_at: -1 },
      populate: {
        path: 'user',
        select: 'name'
      }
    };
    
    const comments = await Comment.paginate(query, options);
    
    res.json({
      success: true,
      data: comments
    });
  });
  
  // Update a comment
  updateComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const commentId = req.params.id;
    const { text } = (req as any).validated.body;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    
    // Only comment author can update it
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to update this comment');
    }
    
    // Update the comment
    comment.text = text;
    await comment.save();
    
    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  });
  
  // Delete a comment (soft delete)
  deleteComment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const commentId = req.params.id;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    
    // Only comment author or admin can delete it
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to delete this comment');
    }
    
    // Soft delete - mark as deleted but keep in database
    comment.is_deleted = true;
    comment.text = '[This comment has been deleted]';
    await comment.save();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  });
}

export const commentController = new CommentController();