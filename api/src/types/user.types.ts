import type { Request } from 'express';
import type { User } from '../generated/prisma/client.js';

export interface AuthedRequest extends Request {
    user: User;
}
