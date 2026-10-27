// Adds demo titles, reviewers and reviews; existing data stays and titles
// that already exist are skipped. Demo accounts come from the demo link
// (POST /auth/demo)
//   dev:    npm run seed
//   server: docker compose -f docker-compose.prod.yml exec api node dist/scripts/seed.js
import crypto from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { updateTitleStats } from '../services/reviewService.js';
import { REVIEWERS, TITLES } from './seedData.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const emailOf = (name: string) =>
  `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

// Fictional reviewers with random passwords
async function ensureReviewers() {
  const ids: number[] = [];
  for (const name of REVIEWERS) {
    const email = emailOf(name);
    const user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: {
          email,
          name,
          emailVerified: true,
          passwordHash: await bcrypt.hash(
            crypto.randomBytes(32).toString('hex'),
            10,
          ),
        },
      }));
    ids.push(user.id);
  }
  return ids;
}

async function addTitles(reviewerIds: number[]) {
  const now = Date.now();
  let added = 0;
  let reviews = 0;

  for (const [index, seed] of TITLES.entries()) {
    const exists = await prisma.title.findFirst({
      where: { name: seed.name, type: seed.type },
    });
    if (exists) continue;

    // The data lists titles by category. Stepping by 7 gives neighbours
    // dates far apart, so "Recently added" mixes movies, games and books.
    // Every title gets its own date while the count is not a multiple of 7
    const slot = (index * 7) % TITLES.length;
    const createdAt = new Date(now - (slot + 1) * 3 * DAY_MS);

    await prisma.$transaction(async (tx) => {
      const title = await tx.title.create({
        data: {
          name: seed.name,
          type: seed.type,
          releaseYear: seed.releaseYear,
          description: seed.description,
          createdById: reviewerIds[index % reviewerIds.length],
          createdAt,
        },
      });

      for (const [order, [reviewer, score, text]] of seed.reviews.entries()) {
        await tx.review.create({
          data: {
            titleId: title.id,
            userId: reviewerIds[reviewer],
            score,
            text: text || null,
            createdAt: new Date(
              createdAt.getTime() + (order + 1) * 8 * HOUR_MS,
            ),
          },
        });
        await updateTitleStats(tx, title.id, score, 1);
      }
    });

    added++;
    reviews += seed.reviews.length;
  }

  return { added, reviews };
}

const reviewerIds = await ensureReviewers();
const { added, reviews } = await addTitles(reviewerIds);
console.log(
  `Added ${added} titles and ${reviews} reviews (${TITLES.length - added} already existed)`,
);
await prisma.$disconnect();
process.exit(0);
