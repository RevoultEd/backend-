import dotenv from 'dotenv';
import { cleanEnv, str, port, url, email, num } from 'envalid';
dotenv.config();

const validateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    PORT: num({ default: 3000 }),
    MONGODB_URI: url(),
    FRONTEND_URL: url(),
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] }),
    JWT_ACCESS_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    GOOGLE_CLIENT_ID: str(),
    GOOGLE_CLIENT_SECRET: str(),
    SMTP_HOST: str(),
    SMTP_PORT: port(),
    SMTP_USER: str(),
    SMTP_PASS: str(),
    EMAIL_FROM: email(),
    PASSWORD_PEPPER: str(),
    
  });
};

export default validateEnv;