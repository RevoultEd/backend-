import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/customErrors';
import { tokenService } from '../services/token.service';
import User from '../models/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const payload = await tokenService.verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
    }
    
    next();
  };
};

// Allow only content creators to modify their own content
export const authorizeContentCreator = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contentId = req.params.id;
    const Content = require('../models/content.model').default;
    
    const content = await Content.findById(contentId);
    if (!content) {
      throw new UnauthorizedError('Content not found');
    }
    
    // Allow admins to modify any content
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if the user is the creator of the content
    if (content.creator.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You are not authorized to modify this content');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting middleware for API endpoints
export const rateLimiter = (limit: number, windowMs: number) => {
  const requests = new Map();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const now = Date.now();
    
    // Clean old requests
    if (requests.has(ip)) {
      const userRequests = requests.get(ip);
      const validRequests = userRequests.filter((timestamp: number) => 
        now - timestamp < windowMs
      );
      
      if (validRequests.length >= limit) {
        throw new UnauthorizedError('Rate limit exceeded');
      }
      
      requests.set(ip, [...validRequests, now]);
    } else {
      requests.set(ip, [now]);
    }
    
    next();
  };
};