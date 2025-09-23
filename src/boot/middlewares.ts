import Logger from "@/logger";
import express from "express";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import cors from "cors";

export const setupMiddlewares = (app: any) => {
  const logger = new Logger('boot', 'midware');

  if (EnvUtil.get(EnvKey.NODE_ENV) === 'production') {
    logger.info('Running in production mode, CORS is restricted.', 'cors');
    app.use(cors({
      origin: EnvUtil.get(EnvKey.CLIENT_ORIGIN),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 200,
      credentials: true,
    }));
  }
  else {
    app.use(cors({
      origin: "*",
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 200,
      credentials: true,
    }));

    switch (EnvUtil.get(EnvKey.NODE_ENV)) {
      case 'development':
        logger.info('Running in development mode, CORS is wide open.', 'cors');
        break;
      case 'test':
        logger.info('Running in test mode, CORS is wide open.', 'cors');
        break;
      case undefined:
        logger.warn('NODE_ENV is not set, CORS is wide open.', 'cors');
        break;
      default:
        logger.warn(`Unknown NODE_ENV "${EnvUtil.get(EnvKey.NODE_ENV)}", CORS is wide open.`, 'cors');
    }
  }

  app.use(express.json());
  logger.info('JSON body parser middleware is set up.', 'json'
}
