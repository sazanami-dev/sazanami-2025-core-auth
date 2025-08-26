import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { EnvUtil, EnvKey } from '@/utils/env-util';
import { registry } from '@/openapi-registry';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import Logger from '@/logger';

export const setupSwagger = (app: Router, logger: Logger) => {
  if (EnvUtil.get(EnvKey.NODE_ENV) === 'production') {
    return; // 本番環境ではSwaggerを有効にしない
  }

  const generator = new OpenApiGeneratorV3(registry.definitions);
  const openApiDocument = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: "Core-Auth API Documentation",
      version: '1.0.0',
      description: '文化祭2025基幹認証システム'
    },
    servers: [
      {
        url: `http://localhost:${EnvUtil.get(EnvKey.PORT)}`,
        description: 'Local server',
      },
    ]
  });

  const swaggerRouter = Router();
  swaggerRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api-docs', swaggerRouter);

  logger.info(`Swagger UI is available at http://localhost:${EnvUtil.get(EnvKey.PORT)}/api-docs`, 'swagger');
}
