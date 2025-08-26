import { createApp } from "./app";
import Logger from "./logger";
import { EnvUtil, EnvKey } from "./utils/env-util";

const logger = new Logger('boot');

const startServer = async () => {
  try {
    const app = await createApp();
    app.listen(EnvUtil.get(EnvKey.PORT), () => {
      logger.success(`Successfully started!`);
      logger.info(`Server is running on port ${EnvUtil.get(EnvKey.PORT)}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

startServer();
