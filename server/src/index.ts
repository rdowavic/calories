import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { routes } from './routes';
import { startScheduledJobs } from './jobs';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handler
app.use(errorHandler);

// Prevent unhandled errors from crashing the server
process.on('uncaughtException', (err) => {
  logger.error({ error: err }, 'Uncaught exception — server staying alive');
});
process.on('unhandledRejection', (reason) => {
  logger.error({ error: reason }, 'Unhandled rejection — server staying alive');
});

// Start server
app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  startScheduledJobs();
});

export default app;
