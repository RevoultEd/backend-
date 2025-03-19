import { z } from 'zod';

export const createBadgeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    description: z.string().min(10).max(200),
    icon_url: z.string().url('Icon URL must be a valid URL'),
    criteria_type: z.enum(['contribution_count', 'download_count', 'upvote_count', 'manual']),
    criteria_value: z.number().int().min(1)
  }),
});

export const updateBadgeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().min(10).max(200).optional(),
    icon_url: z.string().url('Icon URL must be a valid URL').optional(),
    criteria_type: z.enum(['contribution_count', 'download_count', 'upvote_count', 'manual']).optional(),
    criteria_value: z.number().int().min(1).optional()
  }),
});

export const awardBadgeSchema = z.object({
  body: z.object({
    userId: z.string().refine(val => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'User ID must be a valid ObjectId',
    }),
    badgeId: z.string().refine(val => /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Badge ID must be a valid ObjectId',
    })
  }),
});