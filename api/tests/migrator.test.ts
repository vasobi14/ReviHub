import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The migrate image installs the Prisma CLI from migrator/package-lock.json.
// It has to stay on the version the app is built and tested with
const prismaVersionIn = (lockFile: string) =>
  JSON.parse(readFileSync(new URL(lockFile, import.meta.url), 'utf8')).packages[
    'node_modules/prisma'
  ].version;

describe('migrator', () => {
  it('uses the same Prisma version as the API', () => {
    expect(prismaVersionIn('../migrator/package-lock.json')).toBe(
      prismaVersionIn('../package-lock.json'),
    );
  });
});
