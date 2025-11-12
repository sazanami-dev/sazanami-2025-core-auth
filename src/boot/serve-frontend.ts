import express, { Express } from 'express';
import path from 'path';
import Logger from '@/logger';
import { EnvUtil, EnvKey } from '@/utils/env-util';

const logger = new Logger('boot', 'frontend');

export const serveFrontend = (app: Express) => {

  // ../public/fe

  if (EnvUtil.get(EnvKey.NODE_ENV) === 'development') {
    logger.info('Skipping frontend serving in development mode.');
    logger.info('HINT: In development mode, the frontend is served by the Vite dev server.');
    return;
  }

  const frontendPath = path.join(__dirname, '../../public/fe');
  logger.info(`Serving frontend static files from: ${frontendPath}`);
  app.use('/fe/', express.static(frontendPath));

  app.get('/fe/*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  
  logger.info('Frontend serving middleware has been set up.');
}
