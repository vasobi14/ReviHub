import type { AuthUser } from './user.types.js';

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
