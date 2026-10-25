import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import {
  analyticsEnabled,
  recordRequest,
} from '../services/analyticsService.js';

const SKIP =
  /^\/(health|uploads)\b|^\/admin\/(analytics|users\/\d+\/activity)\b/;

function userIdOf(authorization: string | undefined) {
  if (!authorization?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(authorization.slice(7), config.jwtSecret, {
      algorithms: ['HS256'],
    });
    const id = typeof payload === 'string' ? Number.NaN : Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export const requestLog: RequestHandler = (req, res, next) => {
  if (!analyticsEnabled || req.method === 'OPTIONS' || SKIP.test(req.path)) {
    return next();
  }

  const start = performance.now();
  res.on('finish', () => {
    recordRequest({
      method: req.method,
      path: req.originalUrl,
      route: req.route
        ? `${req.baseUrl}${req.route.path}`.replace(/(.)\/$/, '$1')
        : null,
      status: res.statusCode,
      durationMs: Math.round(performance.now() - start),
      userId:
        req.user?.id ??
        res.locals.userId ??
        userIdOf(req.headers.authorization),
      ip: (req.ip ?? '').replace(/^::ffff:/, ''),
      userAgent: req.get('user-agent') ?? '',
    });
  });
  next();
};
