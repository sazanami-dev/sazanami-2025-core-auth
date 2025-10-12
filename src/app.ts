import express from 'express';
import { setupSwagger } from '@/boot/swagger';
import Logger from '@/logger';
import { testPsqlConnection } from './boot/test-connection';
import { setupMiddlewares } from './boot/middlewares';
import { testSignKey } from './boot/test-sign-key';
import indexRouter from './routes';
import { setupCronJobs } from './boot/cron';

export const createApp = async () => {
  const app = express();
  const logger = new Logger('boot');

  setupSwagger(app, logger);

  setupMiddlewares(app);

  setupCronJobs();

  await testPsqlConnection();

  await testSignKey();

  app.use('/', indexRouter);
  logger.info('Routes have been set up');

  return app;
}
