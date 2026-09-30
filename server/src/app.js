import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import health from './routes/health.js';
import auth from './routes/auth.js';
import admins from './routes/admins.js';
import leagues from './routes/leagues.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // photos load from another origin
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use('/uploads', express.static(path.resolve('uploads')));
  app.use('/api/health', health);
  app.use('/api/auth', auth);
  app.use('/api/admins', admins);
  app.use('/api/leagues', leagues);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
