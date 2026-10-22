import fs from 'node:fs/promises';
import app from './app.js';
import config from './config/env.js';
import { prisma } from './lib/prisma.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
    try {
        await fs.mkdir(config.uploadDir, { recursive: true });
        await prisma.$connect();
        logger.info('Database connected');

        const server = app.listen(config.port, () => {
            logger.info(`API running on http://0.0.0.0:${config.port}`);
        });

        const shutdown = async () => {
            logger.info('Shutting down server...');
            server.close(async () => {
                logger.info('Server closed');
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
