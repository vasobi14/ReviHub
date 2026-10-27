import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

export async function setup() {
  console.log('\nStarting PostgreSQL test container...');

  container = await new PostgreSqlContainer('postgres:18-alpine')
    .withDatabase('review_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const connectionUri = container.getConnectionUri();

  process.env.DATABASE_URL = connectionUri;
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long';
  process.env.NODE_ENV = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.PAGE_SIZE = '6';
  process.env.UPLOAD_DIR = 'uploads-test';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.EMAIL_FROM = 'Test <test@example.com>';
  process.env.ANALYTICS_KEY = 'a'.repeat(64);
  process.env.DEMO_LOGIN_KEY = 'test-demo-key-at-least-32-characters';

  console.log('Container started:', connectionUri);

  console.log('Running migrations...');
  execSync('npx prisma migrate deploy', {
    env: process.env,
    stdio: 'inherit',
  });

  console.log('Migrations applied\n');

  fs.mkdirSync(path.resolve('uploads-test'), { recursive: true });

  return async () => {
    console.log('\nStopping PostgreSQL test container...');
    await container.stop();
    console.log('Container stopped');
  };
}
