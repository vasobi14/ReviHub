import type { Role } from '../generated/prisma/client.js';

export interface AuthUser {
  id: number;
  role: Role;
}
