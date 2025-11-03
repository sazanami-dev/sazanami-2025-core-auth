import { createApp } from "@/app";
import Logger from "@/logger";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { registEventLog } from "@/utils/regist-event-log";

const logger = new Logger('boot');

const startServer = async () => {
  try {
    const app = await createApp();
    app.listen(EnvUtil.get(EnvKey.PORT), () => {
      logger.success(`Successfully started!`);
      logger.info(`Server is running on port ${EnvUtil.get(EnvKey.PORT)}`);

      registEventLog(
        "USABILITY",
        "MESSAGE",
        `Server started on port ${EnvUtil.get(EnvKey.PORT)}`,
        "SYSTEM"
      );
      logger.info('Startup event log registered.');
    });
  } catch (err) {
    logger.error(`Failed to start server: ${(err as Error).message}`);
    process.exit(1);
  }
};

startServer();
