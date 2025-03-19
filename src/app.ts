import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import YAML from 'yamljs';
import compression from 'compression';
import routes from './routes/index';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import { corsOptions, helmetOptions, rateLimitOptions } from './utils/securityConfig';
import logger from './utils/logger';

const swaggerDocument = YAML.load('./swagger.yaml');


const app: Application = express();

app.use(compression());
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(rateLimit(rateLimitOptions));
app.use(cookieParser());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim()); 
    },
  },
})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;