// Grants the admin role.
//   dev:    npm run make-admin -- user@example.com
//   server: docker compose -f docker-compose.prod.yml exec api node dist/scripts/makeAdmin.js user@example.com
import { prisma } from '../lib/prisma.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: make-admin <email>');
  process.exit(1);
}

const { count } = await prisma.user.updateMany({
  where: { email },
  data: { role: 'ADMIN' },
});

console.log(count ? `${email} is now an admin` : `No user with email ${email}`);
await prisma.$disconnect();
process.exit(count ? 0 : 1);
