import fs from 'node:fs/promises';
import app from './app.js';
import config from './config/env.js';
import { prisma } from './lib/prisma.js';
import {
  analyticsEnabled,
  deleteOldRequests,
  flushRequestLog,
} from './services/analyticsService.js';
import { deleteOldDemoAccounts } from './services/demoService.js';
import { logger } from './utils/logger.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Runs the task now and then once a day.
function runDaily(name: string, task: () => Promise<void>) {
  const run = () =>
    task().catch((error) => logger.error(`${name} failed:`, error));
  void run();
  setInterval(run, DAY_MS).unref();
}

async function bootstrap() {
  try {
    await fs.mkdir(config.uploadDir, { recursive: true });
    await prisma.$connect();
    logger.info('Database connected');

    if (analyticsEnabled) {
      // Keep the request log to its retention period
      runDaily('Request log cleanup', deleteOldRequests);
    } else {
      logger.warn('ANALYTICS_KEY is not set: request analytics is off');
    }

    runDaily('Demo account cleanup', deleteOldDemoAccounts);

    const server = app.listen(config.port, () => {
      logger.info(`API running on http://0.0.0.0:${config.port}`);
    });

    const shutdown = async () => {
      logger.info('Shutting down server...');
      server.close(async () => {
        logger.info('Server closed');
        await flushRequestLog();
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });
    };

    server.on('error', async (error) => {
      logger.error('Server error:', error);
      await shutdown();
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
