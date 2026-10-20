import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import healthRouter from './routes/health.js';
import reviewsRoutes from './routes/reviews.js';
import worksRoutes from './routes/works.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(config.uploadDir));
app.use(helmet());
app.disable('x-powered-by');

app.use(
    cors({
        origin: config.corsOrigins,
        methods: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
        credentials: true,
    }),
);
app.set('trust proxy', 1);

app.use('/auth', authRoutes);
app.use('/works', worksRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/health', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
