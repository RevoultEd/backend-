import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UnauthorizedError } from '../utils/customErrors';
import validateEnv from '../utils/validateEnv';

validateEnv();


const BlacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
});

const BlacklistedToken = mongoose.model('BlacklistedToken', BlacklistedTokenSchema, 'BlacklistedTokens');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET as string;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET as string;
  }

  generateTokens(payload: TokenPayload) {
    const now = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(
      {
        ...payload,
        iat: now,
        exp: now + 15 * 60
      },
      this.accessTokenSecret
    );

    const refreshToken = jwt.sign(
      {
        ...payload,
        iat: now,
        exp: now + 7 * 24 * 60 * 60
      },
      this.refreshTokenSecret
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const isBlacklisted = await BlacklistedToken.exists({ token });
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async blacklistToken(token: string, expiresAt: Date) {
    await BlacklistedToken.create({
      token,
      expiresAt
    });
  }

  async rotateRefreshToken(oldToken: string, payload: TokenPayload) {
    const tokens = this.generateTokens(payload);
    
    // Blacklist old token
    const decoded = jwt.decode(oldToken) as TokenPayload;
    if (decoded.exp) {
      await this.blacklistToken(oldToken, new Date(decoded.exp * 1000));
    }

    return tokens;
  }

  setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken');
  }
}

export const tokenService = new TokenService();