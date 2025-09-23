import express from 'express';
import { setupSwagger } from '@/boot/swagger';
import Logger from '@/logger';
import { testPsqlConnection } from './boot/test-connection';
import { setupMiddlewares } from './boot/middlewares';

export const createApp = async () => {
  const app = express();
  const logger = new Logger('boot');

  setupSwagger(app, logger);

  setupMiddlewares(app);

  await testPsqlConnection();

  

  return app;
}
