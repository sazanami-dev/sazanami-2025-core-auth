import Logger from "@/logger";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { createProxyMiddleware } from "http-proxy-middleware";

export const devFrontendProxy = (app: any) => {
  const logger = new Logger('boot', 'dev-fe-proxy');

  if (EnvUtil.get(EnvKey.NODE_ENV) === 'production') {
    logger.info('Not setting up frontend proxy in production mode.', 'proxy');
    return;
  }

  const clientOrigin = EnvUtil.get(EnvKey.CLIENT_ORIGIN) || 'http://localhost:3000';
  logger.info(`Setting up frontend proxy to ${clientOrigin}/fe`);
  app.use(
    '/fe',
    createProxyMiddleware({
      target: `${clientOrigin}/fe`,
      changeOrigin: true,
    })
  );
}
