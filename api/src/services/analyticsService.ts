import crypto from 'node:crypto';
import config from '../config/env.js';
import type { RequestLog } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVITY_ROUTES = [
  'GET /titles',
  'GET /titles/:id',
  'POST /titles',
  'PUT /titles/:id',
  'DELETE /titles/:id',
  'POST /reviews',
  'PUT /reviews/:id',
  'DELETE /reviews/:id',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/logout',
  'POST /auth/verify-email',
  'DELETE /admin/users/:id',
];

const deriveKey = (master: Buffer, label: string) =>
  Buffer.from(crypto.hkdfSync('sha256', master, '', label, 32));

const master = config.analyticsKey
  ? Buffer.from(config.analyticsKey, 'hex')
  : null;

const keys = master
  ? { visitor: deriveKey(master, 'visitor'), ip: deriveKey(master, 'ip') }
  : null;

export const analyticsEnabled = keys !== null;

function visitorIdOf(ip: string, userAgent: string, key: Buffer) {
  return crypto
    .createHmac('sha256', key)
    .update(`${ip}|${userAgent}`)
    .digest('hex')
    .slice(0, 32);
}

// AES-256-GCM: random IV + auth tag + ciphertext, readable only with the key
function encryptIp(ip: string, key: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(ip, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decryptIp(value: string) {
  if (!keys) return null;
  try {
    const data = Buffer.from(value, 'base64');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      keys.ip,
      data.subarray(0, 12),
    );
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([
      decipher.update(data.subarray(28)),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
}

// Writes in flight
const pending = new Set<Promise<unknown>>();

export function flushRequestLog() {
  return Promise.all(pending);
}

export function recordRequest(entry: {
  method: string;
  path: string;
  route: string | null;
  status: number;
  durationMs: number;
  userId: number | null;
  ip: string;
  userAgent: string;
}) {
  if (!keys) return;

  const { ip, userAgent, ...rest } = entry;
  const write = prisma.requestLog
    .create({
      data: {
        ...rest,
        userAgent: userAgent || null,
        visitorId: visitorIdOf(ip, userAgent, keys.visitor),
        ipEncrypted: encryptIp(ip, keys.ip),
      },
    })
    // Logging must never break a request
    .catch((error) => logger.warn('Failed to write request log', error))
    .finally(() => pending.delete(write));
  pending.add(write);
}

export async function deleteOldRequests() {
  const { count } = await prisma.requestLog.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * DAY_MS) },
    },
  });
  if (count) logger.info(`Deleted ${count} request log entries`);
}

// Title id of a title page view: /titles/45?from=search → 45
function titleIdOf(row: RequestLog) {
  if (row.route !== '/titles/:id') return null;
  const id = Number(row.path.split('/')[2]?.split('?')[0]);
  return Number.isInteger(id) ? id : null;
}

async function toActivity(rows: RequestLog[]) {
  const titleIds = [
    ...new Set(rows.map(titleIdOf).filter((id) => id !== null)),
  ];
  const titles = await prisma.title.findMany({
    where: { id: { in: titleIds } },
    select: { id: true, name: true },
  });
  const names = new Map(titles.map((title) => [title.id, title.name]));

  return rows.map((fullRow) => {
    const { ipEncrypted, visitorId: _visitorId, ...row } = fullRow;
    const titleId = titleIdOf(fullRow);
    return {
      ...row,
      ip: decryptIp(ipEncrypted),
      titleName: titleId === null ? null : (names.get(titleId) ?? null),
    };
  });
}

const isActivity = (row: RequestLog) =>
  ACTIVITY_ROUTES.includes(`${row.method} ${row.route}`);

async function countVisitors(since: Date) {
  const [requests, visitors, users] = await Promise.all([
    prisma.requestLog.count({ where: { createdAt: { gte: since } } }),
    prisma.requestLog.groupBy({
      by: ['visitorId'],
      where: { createdAt: { gte: since } },
    }),
    prisma.requestLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since }, userId: { not: null } },
    }),
  ]);
  return { requests, visitors: visitors.length, users: users.length };
}

export class AnalyticsService {
  // technical: include session refreshes, review list loads and the like
  async summary(technical = false) {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY_MS);

    const [day, week, topPaths, recent] = await Promise.all([
      countVisitors(new Date(now - DAY_MS)),
      countVisitors(weekAgo),
      prisma.requestLog.groupBy({
        by: ['path'],
        where: {
          createdAt: { gte: weekAgo },
          method: 'GET',
          route: '/titles/:id',
          status: 200,
        },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
      prisma.requestLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
    ]);

    const titleIds = topPaths.map((row) => Number(row.path.split('/')[2]));
    const titles = await prisma.title.findMany({
      where: { id: { in: titleIds } },
      select: { id: true, name: true },
    });
    const names = new Map(titles.map((title) => [title.id, title.name]));

    return {
      enabled: analyticsEnabled,
      day,
      week,
      topTitles: topPaths
        .map((row) => {
          const id = Number(row.path.split('/')[2]);
          return { id, name: names.get(id), views: row._count.path };
        })
        .filter((title) => title.name !== undefined),
      recent: await toActivity(
        (technical ? recent : recent.filter(isActivity)).slice(0, 50),
      ),
    };
  }

  // The user's requests, plus anonymous ones from the same browser and
  // network: what they did before logging in
  async userActivity(userId: number, technical = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    const visitors = await prisma.requestLog.groupBy({
      by: ['visitorId'],
      where: { userId },
    });
    const rows = await prisma.requestLog.findMany({
      where: {
        OR: [
          { userId },
          {
            userId: null,
            visitorId: { in: visitors.map((v) => v.visitorId) },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return {
      enabled: analyticsEnabled,
      user,
      lastSeen: rows.find((row) => row.userId === userId)?.createdAt ?? null,
      requests: rows.filter((row) => row.userId === userId).length,
      activity: await toActivity(
        (technical ? rows : rows.filter(isActivity)).slice(0, 100),
      ),
    };
  }
}

export const analyticsService = new AnalyticsService();
