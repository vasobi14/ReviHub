import { PrismaPg } from '@prisma/adapter-pg';
import config from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({
    connectionString: config.databaseUrl,
});

export const prisma = new PrismaClient({
    adapter,
    log: ['warn', 'error'],
});
