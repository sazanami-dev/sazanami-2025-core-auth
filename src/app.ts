import express from 'express';
import { setupSwagger } from './boot/swagger';
import Logger from './logger';

export const createApp = async () => {
  const app = express();
  const logger = new Logger('boot');

  setupSwagger(app, logger);

  return app;
}
