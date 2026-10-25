import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import config from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLog } from './middleware/requestLog.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import healthRouter from './routes/health.js';
import reviewsRoutes from './routes/reviews.js';
import titlesRoutes from './routes/titles.js';

const app = express();

// One reverse proxy (nginx) in front: take the client IP from X-Forwarded-For
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    methods: 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(requestLog);
app.use('/uploads', express.static(config.uploadDir));

app.use('/auth', authRoutes);
app.use('/titles', titlesRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/admin', adminRoutes);
app.use('/health', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
