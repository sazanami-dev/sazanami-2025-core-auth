import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { Router } from 'express';
import { EnvUtil, EnvKey } from '@/utils/env-util';
import Logger from '@/logger';

export const setupSwagger = (app: Router, logger: Logger) => {
  if (EnvUtil.get(EnvKey.NODE_ENV) === 'production') {
    logger.info('Running in production mode, Swagger UI is disabled.', 'swagger');
    return; // 本番環境ではSwaggerを有効にしない
  }

  const swaggerDocument = swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Core-Auth API Documentation',
        version: '1.0.0',
        description: '文化祭2025基幹認証システム API',
      },
      servers: [
        {
          url: `http://localhost:${EnvUtil.get(EnvKey.PORT)}`,
          description: 'Local server',
        },
      ],
      components: {
        securitySchemes: {
          CookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sessionId',
          },
        },
      },
    },
    apis: [
      path.resolve(process.cwd(), 'src/routes/**/*.ts'),
      path.resolve(process.cwd(), 'src/swagger/**/*.ts'),
    ],
  });

  const swaggerRouter = Router();
  swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use('/api-docs', swaggerRouter);

  logger.info(`Swagger UI is available at http://localhost:${EnvUtil.get(EnvKey.PORT)}/api-docs`, 'swagger');
}
