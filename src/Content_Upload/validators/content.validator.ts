import { z } from 'zod';

// Content Validators
export const createContentSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: 'Title is required',
    }).min(3, 'Title must be at least 3 characters').max(100, 'Title cannot be more than 100 characters'),
    description: z.string({
      required_error: 'Description is required',
    }).min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot be more than 1000 characters'),
    subject: z.enum(['mathematics', 'science', 'language', 'social_studies', 'arts', 'physical_education'], {
      required_error: 'Subject is required',
    }),
    file_url: z.string({
      required_error: 'File URL is required',
    }).url('File URL must be a valid URL'),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateContentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot be more than 100 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot be more than 1000 characters').optional(),
    subject: z.enum(['mathematics', 'science', 'language', 'social_studies', 'arts', 'physical_education']).optional(),
    file_url: z.string().url('File URL must be a valid URL').optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const contentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
    subject: z.enum(['mathematics', 'science', 'language', 'social_studies', 'arts', 'physical_education']).optional(),
    search: z.string().optional(),
  }),
});

export const voteSchema = z.object({
  body: z.object({
    content_id: z.string({
      required_error: 'Content ID is required',
    }).refine(val => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Content ID must be a valid ObjectId',
    }),
    vote_type: z.enum(['upvote', 'downvote'], {
      required_error: 'Vote type is required',
    }),
  }),
});