import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import config from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { updateTitleStats } from '../src/services/reviewService.js';

const uploadDir = config.uploadDir;

export async function clearDatabase() {
  await prisma.requestLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.title.deleteMany();
  await prisma.user.deleteMany();
  try {
    const files = await fs.readdir(uploadDir);
    await Promise.all(
      files
        .filter((f) => f !== '.gitkeep')
        .map((f) => fs.unlink(path.join(uploadDir, f))),
    );
  } catch {}
}

export async function createTestUser(data?: {
  email?: string;
  password?: string;
  name?: string;
  emailVerified?: boolean;
  role?: 'USER' | 'ADMIN' | 'DEMO';
}) {
  const email = data?.email ?? `user${Date.now()}${Math.random()}@test.com`;
  const password = data?.password ?? 'password123';
  const name = data?.name ?? 'Test User';
  const emailVerified = data?.emailVerified ?? true;

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, passwordHash, name, emailVerified, role: data?.role },
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({ where: { id } });
}

export function createToken(
  userId: number,
  role: 'USER' | 'ADMIN' | 'DEMO' = 'USER',
): string {
  return jwt.sign({ sub: String(userId), role }, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export async function createTestTitle(data?: {
  name?: string;
  type?: string;
  releaseYear?: number;
  description?: string;
  createdById?: number;
}) {
  const userId = data?.createdById ?? (await createTestUser()).id;

  return prisma.title.create({
    data: {
      name: data?.name ?? 'Test Title',
      type: data?.type ?? 'movie',
      releaseYear: data?.releaseYear,
      description: data?.description,
      createdById: userId,
    },
  });
}

export async function createReview(data: {
  titleId: number;
  userId: number;
  score: number;
  text?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        titleId: data.titleId,
        userId: data.userId,
        score: data.score,
        text: data.text ?? 'review text',
      },
    });
    await updateTitleStats(tx, data.titleId, data.score, 1);
    return review;
  });
}

export async function authenticatedRequest(userId: number) {
  const { role } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const token = createToken(userId, role);
  return {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

export async function createUserWithReview() {
  const user = await createTestUser();
  const title = await createTestTitle({ createdById: user.id });
  const review = await createReview({
    titleId: title.id,
    userId: user.id,
    score: 8,
    text: 'Great',
  });

  return { user, title, review, token: createToken(user.id) };
}

export function createExpiredToken(userId: number): string {
  return jwt.sign({ sub: String(userId), role: 'USER' }, config.jwtSecret, {
    expiresIn: -1,
  });
}
