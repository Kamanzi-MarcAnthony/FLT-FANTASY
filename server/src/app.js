import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
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
  app.set('trust proxy', 1);
  app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));
  app.use('/api/health', health);
  app.use('/api/auth', auth);
  app.use('/api/admins', admins);
  app.use('/api/leagues', leagues);
  // Production: serve the built Vue app from the same origin as the API
  const dist = path.resolve(import.meta.dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
