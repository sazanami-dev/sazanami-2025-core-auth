import Logger from "@/logger";
import { deleteExpiredPendingRedirects } from "@/services/auth/pending-redirect";

const logger = new Logger('cron', 'sweep-pending-redirect');

async function task() {
  logger.info('Sweeping pending redirects...');
  try {
    const deleted = await deleteExpiredPendingRedirects();
    logger.info(`Swept ${deleted.count} expired pending redirects.`);
  } catch (error) {
    logger.error(`Error sweeping pending redirects: ${(error as Error).message}`);
  }
}

export default task;
