import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'joi';
import logger from '../utils/logger';
import { BadRequestError } from '../utils/customErrors';

export interface ValidatedRequest {
  LocationSearch?: { latitude: number; longitude: number };
  AddressSearch?: string;
  NameSearch?: string;
}


const validateRequest = (schema: Schema, source: 'query' | 'body' | 'params' = 'query') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source]);

    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return next(new BadRequestError(error.details[0].message));
    }
    
    (req as Request & { validatedQuery: ValidatedRequest }).validatedQuery = value;
    next();
  };
};

export default validateRequest;