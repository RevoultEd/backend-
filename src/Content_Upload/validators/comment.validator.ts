import { z } from 'zod';

// Comment Validators
export const createCommentSchema = z.object({
  body: z.object({
    content_id: z.string({
      required_error: 'Content ID is required',
    }).refine(val => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Content ID must be a valid ObjectId',
    }),
    text: z.string({
      required_error: 'Comment text is required',
    }).min(1, 'Comment text is required').max(1000, 'Comment cannot be more than 1000 characters'),
    parent_id: z.string()
      .refine(val => !val || /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'Parent ID must be a valid ObjectId',
      })
      .optional(),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    text: z.string({
      required_error: 'Comment text is required',
    }).min(1, 'Comment text is required').max(1000, 'Comment cannot be more than 1000 characters'),
  }),
});

export const commentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
    parent_id: z.string().optional(),
  }),
});