import type { Request, Response, NextFunction } from 'express';
import { z, ZodObject, ZodError } from 'zod';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/customErrors';

type RequestValidationSchema = ZodObject<{
  body?: ZodObject<any>;
  query?: ZodObject<any>;
  params?: ZodObject<any>;
}>;

export type ValidatedRequest<T extends RequestValidationSchema> = {
  [K in keyof z.infer<T>]: z.infer<T>[K];
};

export const validateRequests = <T extends RequestValidationSchema>(schema: T) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dataToValidate: any = {};
      if (schema.shape.body) dataToValidate.body = req.body;
      if (schema.shape.query) dataToValidate.query = req.query;
      if (schema.shape.params) dataToValidate.params = req.params;

      const validatedData = await schema.parseAsync(dataToValidate);

      (req as any).validated = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn(`Validation error: ${JSON.stringify(errors)}`);
        return next(new BadRequestError(errors[0].message));
      }

      logger.error('Unexpected validation error:', error);
      return next(new BadRequestError('Invalid request data'));
    }
  };
};

export default validateRequests;