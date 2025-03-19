import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { commentController } from '../controllers/comment.controller';
import { authenticateToken, authorize } from '../../middleware/auth.middleware';
import { validateRequests } from '../../middleware/validateRequests';
import { 
  createContentSchema,
  updateContentSchema,
  contentQuerySchema,
  voteSchema
} from '../validators/content.validator';
import { 
  createCommentSchema, 
  updateCommentSchema,
  commentQuerySchema
} from '../validators/comment.validator';
import badgeRoutes from './badge.routes';

const router = Router();

// All routes are protected and require authentication
router.use(authenticateToken);

// Badge routes
router.use('/badges', badgeRoutes);

// Content routes
router.post('/', 
  authorize('teacher', 'admin'),
  validateRequests(createContentSchema),
  contentController.createContent
);

router.get('/', 
  validateRequests(contentQuerySchema),
  contentController.getContentList
);

router.get('/:id', 
  contentController.getContentById
);

router.put('/:id', 
  validateRequests(updateContentSchema),
  contentController.updateContent
);

router.delete('/:id', 
  contentController.deleteContent
);

router.post('/:id/vote', 
  validateRequests(voteSchema),
  contentController.voteContent
);

router.get('/:id/download', 
  contentController.downloadContent
);

// Comment routes
router.post('/comment', 
  validateRequests(createCommentSchema),
  commentController.addComment
);

router.get('/:contentId/comments', 
  validateRequests(commentQuerySchema),
  commentController.getContentComments
);

router.put('/comment/:id', 
  validateRequests(updateCommentSchema),
  commentController.updateComment
);

router.delete('/comment/:id', 
  commentController.deleteComment
);

export default router;