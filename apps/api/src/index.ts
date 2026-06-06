import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { globalRateLimit } from './middleware/rate-limiter';

const app: Express = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(requestLogger);

// Rate limiting
app.use(globalRateLimit);

// Routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 AI BOS API running on port ${env.PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${env.PORT}/api/v1/health`);
});

export default app;
