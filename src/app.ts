import express from 'express';
import { setupSwagger } from '@/boot/swagger';
import Logger from '@/logger';
import { testPsqlConnection } from './boot/test-connection';

export const createApp = async () => {
  const app = express();
  const logger = new Logger('boot');

  setupSwagger(app, logger);

  await testPsqlConnection();

  

  return app;
}
