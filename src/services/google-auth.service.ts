import { OAuth2Client } from 'google-auth-library';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model';
import { UnauthorizedError, AppError } from '../utils/customErrors';
import validateEnv from '../utils/validateEnv';

validateEnv();

export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new AppError('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be set', 500);
    }

    this.initializePassport();
  }

  private initializePassport() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: '/api/v1/auth/google/callback',
          scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
              // Check if user exists with same email
              user = await User.findOne({ email: profile.emails![0].value });

              if (user) {
                // Link Google ID to existing account
                user.googleId = profile.id;
                user.isEmailVerified = true;
                await user.save();
              } else {
                user = await User.create({
                  name: profile.displayName,
                  email: profile.emails![0].value,
                  googleId: profile.id,
                  isEmailVerified: true
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  async verifyGoogleToken(token: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedError('Invalid Google token');
      }

      return {
        email: payload.email!,
        name: payload.name!,
        googleId: payload.sub
      };
    } catch (error) {
      throw new UnauthorizedError('Failed to verify Google token');
    }
  }
}

export const googleAuthService = new GoogleAuthService();