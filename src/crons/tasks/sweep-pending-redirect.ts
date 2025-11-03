import Logger from "@/logger";
import { registEventLog } from "@/utils/regist-event-log";
import { deleteExpiredPendingRedirects } from "@/services/auth/pending-redirect";

const logger = new Logger('cron', 'sweep-pending-redirect');

async function task() {
  logger.info('Sweeping pending redirects...');
  try {
    const deleted = await deleteExpiredPendingRedirects();
    logger.info(`Swept ${deleted.count} expired pending redirects.`);
    if (deleted.count > 0) {
      await registEventLog(
        "USABILITY",
        "MESSAGE",
        `Swept ${deleted.count} expired pending redirects.`,
        "SYSTEM"
      );
      logger.info('Event log for sweeping pending redirects registered.');
    } else {
      logger.info('No expired pending redirects to sweep.');
    }
  } catch (error) {
    await registEventLog(
      "USABILITY",
      "JSON",
      JSON.stringify({
        message: "Error sweeping pending redirects",
        error: (error as Error).message,
      }),
      "SYSTEM"
    );
    logger.error(`Error sweeping pending redirects: ${(error as Error).message}`);
  }
}

export default task;
