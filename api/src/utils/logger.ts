const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
    info: (message: string, meta?: unknown) => {
        if (isProduction) return;
        console.log(`[INFO] ${message}`, meta || '');
    },
    warn: (message: string, meta?: unknown) => {
        console.warn(`[WARN] ${message}`, meta || '');
    },
    error: (message: string, meta?: unknown) => {
        console.error(`[ERROR] ${message}`, meta || '');
    },
};
